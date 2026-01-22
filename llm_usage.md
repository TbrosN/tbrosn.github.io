This project made heavy use of AI assistance, and was created for CMU 15-113, a course on learning to effectively use AI in coding workflows.

# Initial Prototype
The initial prototype was essentially vibe-coded, using an llm to generate a detailed plan. I had the overall vision for the project, and just needed help researching libraries and overall tech stack that would be appropriate.

- I used (web) ChatGPT to generate the plan for the project
- I used Cursor in Agent Mode with Claude Sonnet 4.5 to generate the starter code for the project, using the plan as a prompt
- I continued to use Cursor Agent Mode with new chats of GPT-5.2 to debug certain issues I found with rendering and deployments

I found that making new chats for each bug was pretty effective, and was able to resolve most issues with just a few messages.

# Mobile Support
To make this project mobile-friendly, I created a plan using Cursor Plan mode with GPT-5.2, and then used Cursor Agent Mode with GPT-5.2 to generate the coresponding code. I read carefully through the plan and make a few modifications to make sure the plan made sense before letting the LLM build it.

One key design decision that the LLM was about to mess up: rather than use an interface for mobile support that lets us handle different input methods in a modular way, the LLM was initially planning to do complex casing within our existing code. This would have been a major pain to maintain and debug.

# Optimization
Using my own research, I realized that similar projects rendering 3d scenes in the web used WebGPU for rendering. I used Gemini 3 Flash to explain how this could be used in my app, then used Sonnet 4.5 to make a plan and implement it.

# Pause Menu
For the pause menu, I used Ask Mode with GPT-5.2 and gave it my resume and the requirements for the about page, since I wanted to include that info in the pause menu. I also gave some general guidance on what I wanted the pause menu to look like. After planning, I used Agent Mode to implement it.

This was a bit unsatisfactory, so I made a new plan (in Ask mode) to make adjustments and switched to Sonnet 4.5 to implement it to see if that would be better. I was able to make it look a lot better but was having some bugs that the llm really struggled to fix.