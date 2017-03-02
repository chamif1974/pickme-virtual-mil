/**
 * Written by ksee to integrate TTS
 */

function text_to_speech(text) {
  console.log(text);
//  text = '<express-as type="GoodNews">'+text+'</express-as>';
  text = encodeURIComponent(text);
  $.ajax({
    method: 'GET',
    url: '/api/synthesize?voice=en-US_AllisonVoice&download=true&text='+text,
    dataType: 'native',
    xhrFields: {
      responseType: 'blob'
    },
    success: function(blob) {
      var url = (URL || webkitURL).createObjectURL(blob);
      $('#audio').attr('src', url);
      $('#audio').attr('type', 'audio/ogg;codecs=opus');
    }
  })
}
