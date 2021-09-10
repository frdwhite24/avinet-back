<p align="center">
  <a href="https://github.com/frdwhite24/avinet-back">
   <img src="assets/avinet_logo_rounded_edges.png" width=200>
  </a>

  <h1 align="center">AviNet API 🧑‍✈️✈️🛩️🚁</h1>
</p>

This project is the back-end of a social network and online log record for
pilots. Think Strava for people that love flying!

The back-end is a GraphQL API built in Typescript.

> This project is still in development and should not be relied upon. For
> project backlog, see the Projects tab of the repository.

## Planned AviNet features

_(Prioritise the below list)_

- A user can make a profile page which holds key information about them, they
  can choose what is public and what is private about their account
  (authentication & privacy settings required).
- A user can log a flight. When they are doing this, they can choose which
  aircraft they flew, which airport they flew to and from
  [source](https://ourairports.com/data/), and other key metrics typically
  recorded in the flight log book such as flying hours, landings & take-offs,
  whether they were a pilot under instruction, commanding pilot, co-pilot, date
  and time. Based on the date and time, the weather is automatically populated.
  The flight will have a title, a description of how it went, maybe some photos
  to go with it. Embedded with the flight post is a map showing their route
  from each airfield, or a halo around one airfield if they did airfield work
  or flew from and to the same airfield.
- Users can see their own personal log book on their profiles.
- A user can follow other users and see more detailed information about the
  people that accept their requests (authorisation required).
- A user can see all of the people they follow and their recent flights in a
  main feed.
- A user can comment on and like the flights of other people (maybe limit this
  to only people who have accepted their follow requests?).
- A user can see in an 'Explore' tab, who else has been flying into and out of
  any airfield they've been to, assuming the post is publically visible and not
  private.
- Users get rewards/ rankings based on a metric such as hours flown or number
  of airfields flow into etc. Rank/level/rewards are shown on profile. Maybe
  challenges similar to Duolingo.
- Users can create and manage groups (could be used for airfields etc.)
- A user can invite other people by putting in their email.
- A user can display a tagline such as "Instructor", or "Trainee Pilot".
- ?? A user can send messages to other users if they follow each other ??
- ?? A user can plan their upcoming flights, be given links to key resources
  such as NOTAMs, official weather sources, aviation maps ??
- ?? A user can record their flights using GPS on their phone or by uploading
  the correct file and then can see the route on an embedded map for each
  flight ??
- Notifications for users if someone follows them or likes/comments on a flight. Implement the structure for this.
- Mark favourites/starred locations for easy future use in the saving of flights. i.e. Pluckley Wood for routes out of Headcorn.
