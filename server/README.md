# Instructions for Facilitators

Here are some useful commands that you can use as a Facilitator during the challenge session.

## Reset the game

Clean the data by leaving the server/data folder empty.

```
cd server
rm -rf data/*
```

## Enable a hidden plan

Go to `server/javascripts/gilded_rose.js` and find the `activeItemNames()` function.

Enable an item by uncommenting its line. Disable one by commenting it.

Then restart the server with `Ctrl+C` and `npm start`.

## Hidden plans

Participants, PLEASE DO NOT READ IT.

Facilitator, please go to <a href="/server/hidden_plans.md">the Hidden Plans Readme</a>.

## Give a bonus or malus to a team

Through an interface like Postman:
```
POST /bonus
Content-Type: application/json
{"name":"the-team-name","bonus":-1000000}
```
