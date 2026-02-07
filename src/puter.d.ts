// NOTE: Puter only supports an input image on Gemini models.
declare const puter: {
  ai: {
    txt2img: (
      prompt: string,
      options?: { input_image?: string },
    ) => Promise<any>;
  };
};
