
# word-rnn

If you haven't read the readme and blog post for char-rnn, head on over there before going any further.

This fork alters the original char-rnn in order to work with words instead of characters.  I've also included a heavy metal lyrics dataset, as an example of a situation where this works pretty well.

##The Bad News

Since using words instead of characters blows up the size of vocabulary, memory is a big issue.  Given the same graphics card, you will almost always get better results on the character level, because on the word level you will need to train on a much smaller network.  Unless you're GPU is much fancier than mine.
The word level split works well for a very narrow range of datasets, which are large but contain a minimal number of words.  I've included a dataset of heavy metal lyrics which produces fun results when trained with default values.
To get the memory usage down, you need to reduce either rnn_size or seq_length.  Fortunately, since we are on the word level we get a lot more bang from our buck out of our seq_length.  Still, if you reduce it below 4, the results start to look a lot like a string of random words.
Also, I've stripped out all punctuation to reduce the vocabulary size.  This shouldn't be a big deal to add back in, and I might do so at some point.

##The Good News

This approach removes all spelling mistakes, and it does seem to generate more coherent heavy metal songs, even though I couldn't get the validation loss anywhere near as low as I could with the char level network.

## License

MIT
