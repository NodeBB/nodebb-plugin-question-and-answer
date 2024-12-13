<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "QAPage",
    "mainEntity": {
      "@type": "Question",
      "name": "{mainPost.title}",
      "text": "{{mainPost.content}}",
      "url": "{topicURL}",
      "answerCount": {answerCount},
      "upvoteCount": {votes},
      "dateCreated": "{timestampISO}",
      "author": {
        "@type": "Person",
        "name": "{mainPost.user.username}",
        "url": "{config.relative_path}/user/{mainPost.user.userslug}"
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
            "name": "{acceptedAnswer.user.username}",
            "url": "{config.relative_path}/user/{acceptedAnswer.user.userslug}"
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
            "name": "{suggestedAnswer.user.username}",
            "url": "{config.relative_path}/user/{suggestedAnswer.user.userslug}"
          },
          "upvoteCount": {suggestedAnswer.votes}
        }
        {{{ end }}}
      ]
    }
  }
</script>
