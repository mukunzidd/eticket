const express = require("express");
const graphHttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Event = require("./models/event");
const User = require("./models/user");

const app = express();
app.use(express.json());

app.use(
  "/api",
  graphHttp({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type User {
            _id: ID!
            email: String!
            password: String
        }
        
        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput {
            email: String!
            password: String!
        }
        
        type RootQuery {
            events: [Event!]!
        }
        
        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }
        
        schema {
            query: RootQuery
            mutation: RootMutation
        }
        `),
    rootValue: {
      events: () => {
        return Event.find()
          .then(res => {
            return res.map(event => event._doc);
          })
          .catch(err => {
            throw err;
          });
      },
      createEvent: args => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: args.eventInput.price,
          date: new Date(args.eventInput.date)
        });
        return event
          .save()
          .then(res => {
            return { ...res._doc };
          })
          .catch(err => {
            throw err;
          });
      },
      createUser: args => {
        return bcrypt
          .hash(args.userInput.password, 12)
          .then(hashedPwd => {
            const user = new User({
              email: args.userInput.email,
              password: hashedPwd
            });
            return user.save();
          })
          .then(res => {
            return { ...res._doc, password: null, _id: res.id };
          })
          .catch(err => {
            throw err;
          });
      }
    },
    graphiql: true
  })
);

mongoose
  .connect("mongodb://ninja:ninja111@ds155845.mlab.com:55845/gql-ninja")
  .then(
    app.listen(4000, () => {
      console.log(
        "Now listening for requests on port 4000 and connected to MLab!"
      );
    })
  );
