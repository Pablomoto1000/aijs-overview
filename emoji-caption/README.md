# Emoji Caption


## What it does:
Automatically generated emoji captions for your images

![preview](https://user-images.githubusercontent.com/22820481/34322658-77dc95b0-e825-11e7-8d49-8ae3ba03b84b.png)

Emoji caption automatically generates captions for your images and provides an emoji translation!

Image captions are created with the [Microsoft Azure computer vision API](https://azure.microsoft.com/en-gb/services/cognitive-services/computer-vision/), emojis are generated with use of the [emojilib library](https://github.com/muan/emojilib) and the UI is implemented with Polymer.

## How to run:
1. Clone the repo
2. `cd emoji-caption`
3. `npm i`
4. `bower i`

### Setting up credentials

In order to run the site locally you will need to have an account set up with Azure and an active subscription to the computer vision API. Once you have done this you'll need to edit `credentials.js`, into which you will need to update the `region` and `subscriptionKey` values to your corresponding API keys.

Afterwards, you'll be able to run `npm run dev` to set up a development environment or `npm start` to run a build.

Finally, navigate to [localhost:9000](https://localhost:5000).

## Dependencies:
### Azure Computer Vision
(https://azure.microsoft.com/en-gb/services/cognitive-services/computer-vision/)
This feature returns information about visual content found in an image. Use tagging, domain-specific models and descriptions in four languages to identify content and label it with confidence. Apply the adult/racy settings to help you detect potential adult content. Identify image types and colour schemes in pictures.

### Emojilib
(https://github.com/muan/emojilib)
Emoji keyword library.

## JS code:
The index.js file start the development server, it calls the emoji-caption-app.html where all the scripts are attached, the credentials.js file must be filled with the correct data in order to access the Azure Vision platform. In image-caption-view.html will be processed the caption.
