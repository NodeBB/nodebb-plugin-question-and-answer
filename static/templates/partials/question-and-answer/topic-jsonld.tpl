<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "QAPage",
    "mainEntity": {
      "@type": "Question",
      "name": "{title}",
      "text": "{{mainPost.content}}",
      "url": "{topicURL}",
      "answerCount": {postcount},
      "upvoteCount": {votes},
      "dateCreated": "{timestampISO}",
      "author": {
        "@type": "Person",
        "name": "{mainPost.user.username}"
      },
      "acceptedAnswer": [
        {{{ if acceptedAnswer.content }}}
        {
          "@type": "Answer",
          "text": "{{acceptedAnswer.content}}",
          "dateCreated": "{acceptedAnswer.timestampISO}",
          "url": "{config.relative_path}/post/{acceptedAnswer.pid}",
          "author": {
            "@type": "Person",
            "name": "{acceptedAnswer.user.username}"
          },
          "upvoteCount": {acceptedAnswer.votes}
        }
        {{{ end }}}
      ],
      "suggestedAnswer": [
        {{{ if suggestedAnswer.content }}}
        {
          "@type": "Answer",
          "text": "{{suggestedAnswer.content}}",
          "dateCreated": "{suggestedAnswer.timestampISO}",
          "url": "{config.relative_path}/post/{suggestedAnswer.pid}",
          "author": {
          "@type": "Person",
            "name": "{suggestedAnswer.user.username}"
          },
          "upvoteCount": {suggestedAnswer.votes}
        }
        {{{ end }}}
      ]
    }
  }
</script>