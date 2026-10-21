export { getSpeechPlatform, type SpeechPlatform, type SpeechBrowser, type SpeechOs } from './speechPlatform';
export {
    prepareSpeechText,
    chunkSpeechText,
    splitSpeechSentences,
    buildSpeechQueue,
    defaultUtteranceLang,
    preferredSpeechLangs,
} from './speechTextPrep';
export {
    WebSpeechEngine,
    coordinatorSpeechEngine,
    pickBestSpanishVoice,
    speechEngineEmptySnapshot,
    type SpeechEngineSnapshot,
} from './webSpeechEngine';
