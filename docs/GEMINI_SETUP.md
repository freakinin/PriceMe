# Setting Up Gemini AI for PriceMe

To enable AI analysis (quality scores, materials extraction, image analysis) for competitor products, you need to configure the Google Gemini API.

## Step 1: Get a Free API Key
1.  Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Sign in with your Google account.
3.  Click **"Create API key"**.
4.  Copy the generated key string.

## Step 2: Configure the Application
1.  Open the file `apps/api/.env.local` in your editor.
2.  Add a new line at the bottom:
    ```env
    GEMINI_API_KEY=your_copied_key_here
    ```
    *(Replace `your_copied_key_here` with the actual key you copied)*

## Step 3: Restart the Server
1.  Stop the currently running API server (Ctrl+C in the terminal).
2.  Start it again to load the new key:
    ```bash
    npm run dev
    ```
    *(Or use your preferred start command)*

## Verification
Once restarted, try tracking a competitor product URL again. You should see:
*   ✅ Quality Score (1-10)
*   ✅ List of Materials
*   ✅ AI Analysis Summary
