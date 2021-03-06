/* global React, ReactDOM, chrome */

/**
 * This file handles:
 *   - Starting the microphone stream
 *   - Receiving microphone status and displaying it to the user
 *   - Receiving command transcription and displaying it to the user
 *   - Running the parsed command
*/

import Popup from './view.js';
import { STATES, TIMEOUTS } from '../constants.js';
import MicrophonePermissions from '../microphone/microphone-permissions.js';
import Recorder from '../microphone/recorder.js';
import parser from '../intentEngine/parser.js';

const { useState, useEffect } = React;
const popupContainer = document.getElementById('popup-container');
let isInitialized = false;
let recorder = null;

const PopupController = () => {
  const [currentState, setCurrentState] = useState(STATES.WAITING);
  const [transcription, setTranscription] = useState(null);

  useEffect(() => {
    if (!isInitialized) {
      isInitialized = true;
      init();
    }
  });

  const init = async () => {
    MicrophonePermissions.request();
    recorder = new Recorder();

    // listen for recorder events, so we can update the user interface.
    recorder.onStart = () => {
      setCurrentState(STATES.LISTENING);
    };

    recorder.onEndRecording = async (phrases) => {
      if (!phrases || phrases.length === 0) {
        setCurrentState(STATES.ERROR);
        await new Promise((r) => setTimeout(r, 1500));
        window.close();
      }
      const utterence = parser.pickBestUtterenceDetected(phrases);
      setTranscription(utterence);
      chrome.runtime.sendMessage({
        type: 'utterence',
        data: utterence,
      });
      setTimeout(() => window.close(), 2000);
    };

    recorder.startRecording();
    setTimeout(window.close, TIMEOUTS.WAIT_FOR_COMMAND);
  };

  return (
    <Popup
      currentState={currentState}
      transcription={transcription}
    />
  );
};

ReactDOM.render(<PopupController />, popupContainer);
