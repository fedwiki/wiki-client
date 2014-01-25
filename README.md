wiki-client
===========

Federated wiki client-side javascript as a npm module.

Goals
=====

Over its first two years the Smallest Federated Wiki (SFW) project explored
many ways that a wiki could embrace HTML5 and related technologies. Here
we will cautiously reorganize this work as small independent modules that
favor ongoing innovation.

We proceed by dividing SFW first into large pieces and then these into
smaller pieces as we simplify and regularize the communications between them.
We now favor the node.js module and event conventions, dependency injection,
and increased separation between the DOM and the logic that manages it.

Federated wiki's single-page application reads page content from many sources
and writes updates to a few. Read-write server backends are maintained in
ruby (sinatra) and node (express). Read-only servers have been realized
with static files and cgi scripts. Encouraging experiments have exploited
exotic service architectures such as CCNx content-addressable networks.

Participation
=============

We're happy to take issues or pull requests regarding the goals and
their implementation within this code.

A wider-ranging conversation is documented in the GitHub ReadMe of the
founding project, [SFW](https://github.com/WardCunningham/Smallest-Federated-Wiki/blob/master/ReadMe.md).
