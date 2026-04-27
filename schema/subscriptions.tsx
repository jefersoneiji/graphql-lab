import { builder } from "../builder";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

builder.subscriptionField('notifications', t =>
    t.string({
        nullable: false,
        authScopes: { $any: { guest: true, admin: true, user: true } },
        subscribe: async function* (_parent, _args, _ctx, _info) {
            const greetings = [
                "New message received!",
                "Your order has been shipped.",
                "Reminder: Meeting starts in 15 minutes.",
                "You have 3 new friend requests.",
                "Security alert: New login detected.",
                "Your password expires in 5 days.",
                "Weekly report is ready for review.",
                "Someone liked your photo.",
                "Payment processed successfully.",
                "Update available for application.",
                "Reminder: Pay rent tomorrow.",
                "Your package is out for delivery.",
                "New comment on your post.",
                "Your profile has been updated.",
                "Low battery warning."
            ];
            let index = 0;

            while (true) {
                yield greetings[index % greetings.length];
                index++;

                // Wait for 2 seconds before sending the next one
                await delay(2000);
            }
        },
        resolve: (notification) => notification,
    }),
);

builder.subscriptionField('vote', t =>
    t.float({
        nullable: false,
        authScopes: { $any: { guest: true, admin: true, user: true } },
        subscribe: (_parent, _args, context) => context.pubsub.subscribe('VOTE_ADDED'),
        resolve: vote => Number(vote)
    })
)

builder.mutationField('vote', t =>
    t.float({
        authScopes: { $any: { guest: true, admin: true, user: true } },
        resolve: (_parent, _args, ctx) => {
            function getRandomInt(min: number, max: number) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }

            const vote_value = getRandomInt(1, 100)
            ctx.pubsub.publish('VOTE_ADDED', vote_value.toString())
            return vote_value
        }
    })
)