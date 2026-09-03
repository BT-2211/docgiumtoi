1. Info

## AI Riser Vietnam 2026 Competition

AI Riser was a national challenge for developers, students, and startups in Vietnam to build AI projects using Google tools like Gemini, AI Studio, and Cloud Run.  

Participants created solutions, submitted them by **30/08/2026**, and competed for recognition, mentorship, and prizes.  

Originally a project for the competition above, though the competition is closed, this project represents my entry and the work I put into building with AI.

2. Problem

Declining eyesight in senior citizens creates dangerous daily barriers when dealing with packaged goods and medicine:

Tiny & Reflected Text: Expiration dates and dosage instructions are printed in micro-fonts (6–8pt) or placed on reflective packaging.

Health Risks: Misreading expiry dates or taking the wrong dosage poses direct health hazards.

Loss of Independence: Seniors often rely on family members just to read basic labels ("Can you check the expiry date on this for me?").

3. Solution
DocGiumToi keeps interactions extremely simple, safe, and voice-first:

1-Tap Scan: Seniors tap a single massive button on screen to snap a photo of a medicine box or food label.

Gemini Extraction: Gemini Vision API parses the image, filters out noise, and extracts 3 core data points: Product Name, Expiration Date, and Dosage / Safety Warnings.

Vietnamese Voice Output: Reads the results aloud in clear, slow Vietnamese text-to-speech. If the image is blurry, the AI explicitly prompts the user to turn the box around rather than guessing dangerous details.

4. Technology
AI Engine: Google Gemini API (Gemini 2.5 Flash / Vision)

AI Prototyping: Google AI Studio

Text-to-Speech: Web Speech API (Vietnamese Voice Engine)

Hosting: Google Cloud Run


6. What I Learned
Stitch: Using stitch to get a sketch of the product, UI/UX

Gemini prompt engineering:Ma generating refined prompts for google ai studios
                          Pormpting prevent LLM hallucinations when handling sensitive medical or dietary data.

Presenting in a video format

7. Future Improvements
Improving on AI ability to discern between expiration dates and other information containing numbers

Using data base of item to check for cases such as "use 24 hours after open"

Offline Local Storage: Cache frequently scanned everyday medicine labels for offline voice lookup without needing active internet access.

