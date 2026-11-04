// Amina's two Meet calls, written to be spoken. Each node is one continuous recording.
// `lines` are the captions; `say` is what she was given to read, with delivery directions in brackets.
// A node may end with `ask`, where the learner answers. Answers are never scored and only change her reply.
export const CALLS = {
  briefing: {
    title: 'Case 0417 briefing',
    code: 'kia-brief-0417',
    start: 'hello',
    nodes: {
      hello: {
        say: "[warmly] Hey! Oh good, you made it. Can you hear me okay? ... [chuckles softly] Okay, great. So, how's your morning going so far?",
        lines: ['Hey! Oh good, you made it. Can you hear me okay?', "Okay, great. So, how's your morning going so far?"],
        ask: [{label: 'Good, thanks!', next: 'good'}, {label: 'A bit nervous, honestly', next: 'nervous'}],
      },
      good: {say: "[warmly] Ah, nice, love to hear it.", lines: ['Ah, nice, love to hear it.'], next: 'who'},
      nervous: {
        say: "[laughs lightly] Oh, don't worry, everybody is on their first day. You're going to be fine, I promise.",
        lines: ["Oh, don't worry, everybody is on their first day. You're going to be fine, I promise."], next: 'who',
      },
      who: {
        say: "So, I'm Amina. I'm the senior analyst here, and you're our new junior engineer, so... you'll be working with me on this one, okay? It's case zero four one seven, and we think it's a mobile money fraud ring.",
        lines: ["So, I'm Amina. I'm the senior analyst here, and you're our new junior engineer.", "So you'll be working with me on this one, okay?", "It's case 0417, and we think it's a mobile-money fraud ring."], next: 'items',
      },
      items: {
        say: "Now, three things landed on my desk this morning. A text message, a photograph and, you won't believe this, an actual audio recording on tape. [chuckles] I know. So our job is to get all three digitised, processed and stored, without losing anything that matters. And we've only got a limited amount of storage, so... we have to be a bit careful. Does that make sense so far?",
        lines: ['Now, three things landed on my desk this morning.', "A text message, a photograph and, you won't believe this, an actual audio recording on tape.", 'So our job is to get all three digitised, processed and stored, without losing anything that matters.', "And we've only got a limited amount of storage, so we have to be a bit careful.", 'Does that make sense so far?'],
        ask: [{label: 'Yes, that makes sense', next: 'clear'}, {label: 'Sorry, can you say that again?', next: 'again'}],
      },
      clear: {say: '[warmly] Perfect.', lines: ['Perfect.'], next: 'plan'},
      again: {
        say: "Of course, no problem. Three items. Keep everything that matters, and make it all fit in the storage we've got. That's really it.",
        lines: ['Of course, no problem. Three items.', "Keep everything that matters, and make it all fit in the storage we've got. That's really it."], next: 'plan',
      },
      plan: {
        say: "So here's the plan. We'll prepare the evidence, then you'll do the text, then the image, then the sound, and at the end you hand it all over to me. I'll be scoring how you handle the evidence, and your text, image and audio decisions. Not your speed, okay? So please, take your time.",
        lines: ["So here's the plan. We'll prepare the evidence, then you'll do the text, then the image, then the sound.", 'And at the end you hand it all over to me.', "I'll be scoring how you handle the evidence, and your text, image and audio decisions.", 'Not your speed, okay? So please, take your time.'], next: 'rule',
      },
      rule: {
        say: "Oh, and one rule before you go. We always work on copies. Never the original. Yeah?",
        lines: ['Oh, and one rule before you go.', 'We always work on copies. Never the original. Yeah?'], next: 'tape',
      },
      tape: {
        say: "The tape is actually the most fragile one, but the deck is booked for this afternoon. So we'll start with the text and the photo, and the tape just stays sealed until then.",
        lines: ['The tape is actually the most fragile one, but the deck is booked for this afternoon.', "So we'll start with the text and the photo, and the tape just stays sealed until then."], next: 'bye',
      },
      bye: {
        say: "[warmly] Alright, that's it from me. I'm sending you the intake record in Chat now. Message me if you get stuck, okay? Talk soon!",
        lines: ["Alright, that's it from me. I'm sending you the intake record in Chat now.", 'Message me if you get stuck, okay? Talk soon!'],
      },
    },
  },
  closing: {
    title: 'Case 0417 handover review',
    code: 'kia-review-0417',
    start: 'hey',
    nodes: {
      hey: {
        say: "[warmly] Hey, you! So that's the handover in. How are you feeling?",
        lines: ["Hey, you! So that's the handover in. How are you feeling?"],
        ask: [{label: 'Pretty good, actually', next: 'fine'}, {label: 'That was harder than I expected', next: 'hard'}],
      },
      fine: {say: '[warmly] Good, you should. You did really well.', lines: ['Good, you should. You did really well.'], next: 'review'},
      hard: {
        say: "[laughs lightly] Yeah, it's meant to be. But you got through it, and that's what counts.",
        lines: ["Yeah, it's meant to be. But you got through it, and that's what counts."], next: 'review',
      },
      review: {
        say: "So let's look back at your decisions. It's all in your record, and if you open each card you'll see what you chose, what happened, and what the strongest path looks like.",
        lines: ["So let's look back at your decisions. It's all in your record.", "If you open each card you'll see what you chose, what happened, and what the strongest path looks like."], next: 'wins',
      },
      wins: {
        say: "But honestly? Text intact, plate legible, buzzer preserved, originals untouched, and all of it inside the allocation. That's a good day's work.",
        lines: ['But honestly? Text intact, plate legible, buzzer preserved, originals untouched.', "And all of it inside the allocation. That's a good day's work."], next: 'bye',
      },
      bye: {
        say: "And notice what we did. We never added anything, and we never threw away anything we couldn't get back. That's really the whole job. [warmly] Good work, okay? I'll see you in the record.",
        lines: ['And notice what we did. We never added anything, and we never threw away anything we couldn\'t get back.', "That's really the whole job. Good work, okay? I'll see you in the record."],
      },
    },
  },
};
