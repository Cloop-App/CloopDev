# Free Text Answer System: End-to-End Flow

This document outlines the complete data and logic flow for the interactive topic chat, focusing on how the system handles free-text answers, provides corrections, and guides the user through learning goals.

## High-Level Goal

The system acts as an AI tutor. It interactively quizzes a user on a specific topic, evaluates their free-text answers for correctness (conceptual, grammatical, spelling), provides immediate and detailed feedback, and guides them until the topic's learning goals are met.

---

## Step 1: Chat Initiation

1.  **User Action**: The user selects a topic to start a chat.zgfoks
2.  **Frontend (`topic-chat.tsx`)**:
    *   The `TopicChatScreen` component mounts.
    *   The `loadTopicChat` function is called.
    *   It sends a `GET` request to the backend API (`/api/topic-chats/:topicId`) to fetch the current state of the chat, including previous messages and learning goals.
3.  **Backend API (`topic-chats.js`)**:
    *   The `GET` endpoint receives the request.
    *   It fetches all existing chat messages and goals for the topic from the database.
    *   **If no messages exist**, it calls `generateTopicGreeting` in the AI service (`topic_chat.js`).
4.  **Backend AI Service (`topic_chat.js`)**:
    *   `generateTopicGreeting` constructs a prompt for the OpenAI `gpt-4o` model, instructing it to create a welcome message and the very first question for the topic.
    *   The AI returns a JSON object containing these two initial messages.
5.  **Data Flow back to Frontend**:
    *   The backend API sends the message history (or the newly generated greeting and first question) back to the frontend.
    *   `topic-chat.tsx` receives the messages and uses `setMessages` to render the initial chat screen, displaying the AI's first question.

## Step 2: User Submits an Answer

1.  **User Action**: The user types their answer into the `TextInput` and presses send.
2.  **Frontend (`topic-chat.tsx`)**:
    *   The `handleSendMessage` function is triggered.
    *   It immediately creates a temporary "optimistic" user message and adds it to the `messages` state array. This makes the user's message appear on screen instantly for a better user experience.
    *   It then calls `sendTopicChatMessage`, which sends a `POST` request to the backend API (`/api/topic-chats/:topicId/message`) containing the user's answer.

## Step 3: Backend Evaluation and AI Response

1.  **Backend API (`topic-chats.js`)**:
    *   The `POST` endpoint is hit. It saves the user's message to the database.
    *   It fetches the recent chat history and the current learning goal to provide context for the AI.
    *   It calls the core `generateTopicChatResponse` function in the AI service.
2.  **Backend AI Service (`topic_chat.js`)**:
    *   `generateTopicChatResponse` constructs a detailed system prompt for `gpt-4o`. This prompt is the "brain" of the operation and instructs the AI on exactly how to behave. It tells the AI to:
        *   Evaluate the user's answer for conceptual, grammatical, and spelling errors.
        *   Return a specific JSON object based on the evaluation.
    *   The service sends the prompt and conversation history to the OpenAI API.
3.  **OpenAI Processing**: The `gpt-4o` model processes the request and returns a structured JSON object.

## Step 4: Handling the AI Response (The Correction Flow)

This is the most critical part of the flow.

1.  **AI Response (Scenario: Answer has errors)**:
    *   The AI service receives a JSON response from OpenAI structured like this:
        ```json
        {
          "messages": [],
          "user_correction": {
            "message_type": "user_correction",
            "diff_html": "Force is a push or pull on an object that <del>causess</del><ins>causes</ins> it to change its <del>not</del> motion or <del>no</del> shape.",
            "complete_answer": "The full, correct answer explained simply.",
            "options": ["Got it", "Confused"],
            "feedback": { "is_correct": false, "bubble_color": "red", ... }
          }
        }
        ```
2.  **Backend API (`topic-chats.js`)**:
    *   The API receives this `user_correction` object.
    *   It finds the user message that was just saved in the database and **updates** it, setting its `message_type` to `user_correction` and saving the `diff_html`.
    *   It then sends a response back to the frontend containing the updated user message object and the `userCorrection` data.
3.  **Frontend (`topic-chat.tsx`)**:
    *   `handleSendMessage` receives the response from the backend.
    *   It identifies that `response.userCorrection` exists.
    *   It creates a **single, updated user message object** that includes:
        *   The original message ID.
        *   `message_type: 'user_correction'`.
        *   `diff_html`: The red/green correction text.
        *   `message`: The `complete_answer` from the AI.
        *   `options`: The `["Got it", "Confused"]` array.
    *   It updates the `messages` state array, replacing the temporary optimistic message with this single, consolidated, corrected message object.
4.  **Frontend Rendering (`MessageBubble.tsx`)**:
    *   The `MessageBubble` component receives the message object with `messageType: 'user_correction'`.
    *   The component is now designed to handle this type by rendering three parts within a single bubble:
        1.  The `diff_html` (the red/green text).
        2.  The `message` (the complete correct answer).
        3.  The `options` (the "Got it" and "Confused" buttons).

## Step 5: User Follow-up

1.  **User Action**: The user clicks either "Got it" or "Confused".
2.  **Frontend (`topic-chat.tsx`)**:
    *   `handleOptionSelect` is called, which in turn calls `handleSendMessage` again, but this time the message text is "Got it" or "Confused".
3.  **Backend and AI**:
    *   The process repeats from Step 3.
    *   The AI service's prompt instructs the AI on how to handle "Got it" (move to the next question) or "Confused" (provide an explanation, then move to the next question). The AI then generates the appropriate next messages.
    *   This loop continues until all learning goals for the topic are met.
