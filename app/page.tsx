/* 
- Copy and paste this code into your Next.js applications's "app/page.tsx" file to get started 
- Make sure to run "npm install usellm" to install the useLLM pacakge
- Replace the `serviceUrl` below with your own service URL for production
*/
"use client";
import { useEffect, useRef, useState } from "react";
import useLLM, { OpenAIMessage } from "usellm";

const sys ="you are a assistant who helps to create music by providing a python code to generate a music in desired genre , key, frequency, tempo , scenario, complexity etc.. \r\n\r\nexample output : \r\n\r\nimport math\r\nfrom midiutil import MIDIFile\r\n\r\n# Set the time signature and tempo\r\ntime_signature = (4, 4)\r\ntempo = 160\r\n\r\n# Set the key of C major\r\nkey = 0  # C major key number\r\n\r\n# Define the melody notes\r\nmelody_degrees = [1, 2, 3, 4, 5, 6, 7, 8, 8, 7, 6, 5, 4, 3, 2, 1,\r\n                  1, 3, 5, 6, 8, 10, 10, 9, 6, 3, 2, 1]  # Complex melody degrees in C major\r\nmelody_pitches = [key + 12 + (degree - 1) * 2 for degree in melody_degrees]  # The first C is one octave below middle C\r\n\r\n# Define the harmony notes\r\nharmony_degrees = [1, 3, 5, 6, 8, 10, 10, 9, 6, 3, 1, 3, 5,\r\n                   6, 5, 3, 1, 3, 5, 6, 8, 6, 5, 3, 1]  # Complex harmony degrees in C major\r\nharmony_pitches = [key + 12 + (degree - 1) * 2 for degree in harmony_degrees]  # The first C is one octave below middle C\r\n\r\n# Define the note durations and velocities\r\nquarter_note_duration = 0.5\r\nvelocity = 80\r\n\r\n# Create the MIDI file and add the tempo and time signature\r\nmidi_file = MIDIFile(numTracks=2)\r\nmidi_file.addTempo(track=0, time=0, tempo=tempo)\r\nmidi_file.addTimeSignature(track=0, time=0, numerator=time_signature[0], denominator=time_signature[1], clocks_per_tick=24, notes_per_quarter=8)\r\n\r\n# Add the melody notes to the MIDI file\r\nfor i, pitch in enumerate(melody_pitches):\r\n    time = i * quarter_note_duration\r\n    midi_file.addNote(track=0, channel=0, pitch=pitch, time=time, duration=quarter_note_duration, volume=velocity)\r\n\r\n# Add the harmony notes to the MIDI file\r\nfor i, pitch in enumerate(harmony_pitches):\r\n    time = i * quarter_note_duration\r\n    if i in [4, 8, 12, 16, 20, 24]:\r\n        volume = velocity \/\/ 2\r\n    else:\r\n        volume = velocity \/\/ 4\r\n    midi_file.addNote(track=1, channel=0, pitch=pitch, time=time, duration=quarter_note_duration, volume=volume)\r\n\r\n# Save the MIDI file\r\nwith open(\"romantic_midi.mid\", \"wb\") as output_file:\r\n    midi_file.writeFile(output_file)\r\n\r\nprint(\"MIDI file 'romantic_midi.mid' generated.\")"

export default function AIChatBot() {
  const [status, setStatus] = useState<Status>("idle");
  const [history, setHistory] = useState<OpenAIMessage[]>([
    
    {
      role: "system",
      content: sys,
    },
    
    {
      role: "assistant",
      content:
        "I'm a chatbot powered by the ChatGPT API and developed using useLLM. Ask me anything!",
    },
  ]);
  const [inputText, setInputText] = useState("");

  const llm = useLLM({
    serviceUrl: "https://usellm.org/api/llm", // For testing only. Follow this guide to create your own service URL: https://usellm.org/docs/api-reference/create-llm-service
  });

  let messagesWindow = useRef<Element | null>(null);

  useEffect(() => {
    if (messagesWindow?.current) {
      messagesWindow.current.scrollTop = messagesWindow.current.scrollHeight;
    }
  }, [history]);

  async function handleSend() {
    if (!inputText) {
      return;
    }
    try {
      setStatus("streaming");
      const newHistory = [...history, { role: "user", content: inputText }];
      setHistory(newHistory);
      setInputText("");
      const { message } = await llm.chat({
        messages: newHistory,
        stream: true,
        onStream: ({ message }) => setHistory([...newHistory, message]),
      });
      setHistory([...newHistory, message]);
      setStatus("idle");
    } catch (error: any) {
      console.error(error);
      window.alert("Something went wrong! " + error.message);
    }
  }

  async function handleRecordClick() {
    try {
      if (status === "idle") {
        await llm.record();
        setStatus("recording");
      } else if (status === "recording") {
        setStatus("transcribing");
        const { audioUrl } = await llm.stopRecording();
        const { text } = await llm.transcribe({ audioUrl });
        setStatus("streaming");
        const newHistory = [...history, { role: "user", content: text }];
        setHistory(newHistory);
        const { message } = await llm.chat({
          messages: newHistory,
          stream: true,
          onStream: ({ message }) => setHistory([...newHistory, message]),
        });
        setHistory([...newHistory, message]);
        setStatus("idle");
      }
    } catch (error: any) {
      console.error(error);
      window.alert("Something went wrong! " + error.message);
    }
  }

  const Icon = status === "recording" ? Square : Mic;

  return (
    <div className="flex flex-col h-full max-h-[600px] overflow-y-hidden">
      <div
        className="w-full flex-1 overflow-y-auto px-4"
        ref={(el) => (messagesWindow.current = el)}
      >
        {history.map((message, idx) => (
          <Message {...message} key={idx} />
        ))}
      </div>
      <div className="w-full pb-4 flex px-4">
        <input
          className="p-2 border rounded w-full block dark:bg-gray-900 dark:text-white"
          type="text"
          placeholder={getInputPlaceholder(status)}
          value={inputText}
          disabled={status !== "idle"}
          autoFocus
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          className="p-2 border rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-white dark:text-black font-medium ml-2"
          onClick={handleSend}
        >
          Send
        </button>
        <button
          className="p-2 border rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-white dark:text-black font-medium ml-2"
          onClick={handleRecordClick}
        >
          <Icon />
        </button>
      </div>
    </div>
  );
}

const Mic = () => (
  // you can also use an icon library like `react-icons` here
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" x2="12" y1="19" y2="22"></line>
  </svg>
);

const Square = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
  </svg>
);

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.substring(1);
}

type Status = "idle" | "recording" | "transcribing" | "streaming";

function getInputPlaceholder(status: Status) {
  switch (status) {
    case "idle":
      return "Ask me anthing...";
    case "recording":
      return "Recording audio...";
    case "transcribing":
      return "Transcribing audio...";
    case "streaming":
      return "Wait for my response...";
  }
}

function Message({ role, content }: OpenAIMessage) {
  return (
    <div className="my-4">
      <div className="font-semibold text-gray-800 dark:text-white">
        {capitalize(role)}
      </div>
      <div className="text-gray-600 dark:text-gray-200 whitespace-pre-wrap mt-1">
        {content}
      </div>
    </div>
  );
}