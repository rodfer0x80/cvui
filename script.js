var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

// Output:
var synth = window.speechSynthesis;


var grammar = "#JSGF V1.0; grammar calendar; public <calendar> =  ...;";

//Regular expressions for the different utternaces
var u1 = /.*book(| a| an) even(t|ts)$/;
var u2 = /.*book(| a| an) even(t|ts) from ((1[0-2]|0?[1-9])|(1[0-2]|0?[1-9]):([0-5]?[0-9]))(| a\.m\.| p\.m\.)*$/i;
var u3 = /.*book(| a| an) even(t|ts) from ((1[0-2]|0?[1-9])|(1[0-2]|0?[1-9]):([0-5]?[0-9]))(| a\.m\.| p\.m\.) to (1[0-2]|0?[1-9]):([0-5]?[0-9])(| a\.m\.| p\.m\.)$/i;

var u4 = /(?:from)?\s*((1[0-2]|0?[1-9])|(1[0-2]|0?[1-9]):([0-5]?[0-9]))(| a\.m\.| p\.m\.)$/i;
var u5 = /(?:to)?\s*((1[0-2]|0?[1-9])|(1[0-2]|0?[1-9]):([0-5]?[0-9]))(| a\.m\.| p\.m\.)$/i;


var recognition = new SpeechRecognition();
var speechGramList = new SpeechGrammarList();
//speechGramList.addFromString(grammar, 1);
//recognition.grammars = speechGramList;

// Parameters of the decognition:
recognition.continuous = false;
recognition.lang = 'en-GB';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

var resp = document.querySelector('.response');
var toggle = document.querySelector('.toggle');
var diagnostic = document.querySelector('.diagnostic');

toggle.onclick = function () {
  resp.textContent = "...";
  console.log('Ready to receive voice command.');
  enterState(0);
}

var state = 0;
var startPlace = null;
var endPlace = null;

function enterState(s) {
  console.log("Entering state:", s);
  // set new state
  state = s;
  // say something for this state
  // Note need to pass in the function that does the next thing as a parameter,
  // so that in can be done after the speech.
  sayState(state, function () {
    if (isFinal(state)) {

      var msg = "Event booken in your calendar  " + startPlace + " to " + endPlace;
      utterThis = new SpeechSynthesisUtterance(msg);
      synth.speak(utterThis);
    } else { recognition.start(); }
  });
}

// Final states:
function isFinal(s) { return s == 5; }

// Things it can say in the different states.
var sayings = {
  0: "Calendar Voice User Interface is listening...",
  1: "When does the event start, day and time.?",
  3: "And when does it end?",
  5: "Done!"
}

function sayState(s, afterSpeechCallback) {
  var textOut = sayings[s];
  resp.textContent = "State: " + s + "  " + textOut;

  var utterThis = new SpeechSynthesisUtterance(textOut);
  utterThis.onend = function (event) {
    console.log('SpeechSynthesisUtterance.onend');
  }
  utterThis.onerror = function (event) {
    console.error('SpeechSynthesisUtterance.onerror');
  }
  utterThis.onend = afterSpeechCallback;

  synth.speak(utterThis);
}

recognition.onresult = function (event) {
  console.log('onresult');
  // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
  // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
  // It has a getter so it can be accessed like an array
  // The first [0] returns the SpeechRecognitionResult at the last position.
  // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
  // These also have getters so they can be accessed like arrays.
  // The second [0] returns the SpeechRecognitionAlternative at position 0.
  // We then return the transcript property of the SpeechRecognitionAlternative object

  var text = event.results[0][0].transcript;
  diagnostic.textContent = 'Result received: ' + text + '.';

  // figure out what they've said;
  // record slot fillers
  // what they've said + state -> new state
  // enterState(newState);

  console.log("State:", state);
  // What speech we are expecting depends on the state we're in:
  switch (state) {
    case 0:
      if (text.match(u1)) { enterState(1); }
      else if (m = text.match(u3)) { startPlace = m[1]; endPlace = m[2]; enterState(5); } // "...from .... to ..."
      else if (m = text.match(u2)) { startPlace = m[1]; enterState(3); } // "...from ...."
      else {
        // re-enter the current state.
        // would be better to give an error message here as well:
        enterState(state);
      }
      break;
    case 1:
      if (m = text.match(u4)) { // "...from ...."
        console.log("Matched - pickup"); startPlace = m[1]+" "+m[5]; enterState(3);console.log(m);
      } else {
        // re-enter the current state.
        // would be better to give an error message here as well:
        enterState(state);
      }
      break;

    case 3:
      if (m = text.match(u5)) {
        console.log("Matched - destination");
        endPlace = m[1]+" "+m[5]; enterState(5);;
      } else {
        // re-enter the current state.
        // would be better to give an error message here as well:
        enterState(state);
      }
      break;

    case 5:
      break;
  }

  console.log(event.results);
  console.log('Confidence: ' + event.results[0][0].confidence);

}


// recognition.onaudiostart = function() { console.log("onaudiostart"); }
// recognition.onaudioend = function() { console.log("onaudioend"); }
//
// recognition.onsoundstart = function() { console.log("onsoundstart"); }
// recognition.onsoundend = function() { console.log("onsoundend"); }
//
// recognition.onspeechstart = function() { console.log("onspeechstart"); }
recognition.onspeechend = function () { //console.log("onspeechend");
  recognition.stop();
}

// recognition.onstart = function() { console.log("onstart"); }
// recognition.onend = function() { console.log("onsend"); }

recognition.onnomatch = function (event) {
  //console.log('onnomatch', event);
  diagnostic.textContent = "I didn't recognise that.";
}

recognition.onerror = function (event) {
  //console.log('onerror', event);
  diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
}
