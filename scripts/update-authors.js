const gitAuthors = require('grunt-git-authors')

// list of contributers from prior the split out of Smallest Federated Wiki repo.
const priorAuthors = [
  'Ward Cunningham <ward@c2.com>',
  'Stephen Judkins <stephen.judkins@gmail.com>',
  'Sam Goldstein <sam@aboutus.org>',
  'Steven Black <steveb@stevenblack.com>',
  'Don Park <don@donpark.org>',
  'Sven Dowideit <SvenDowideit@fosiki.com>',
  'Adam Solove <asolove@gmail.com>',
  'Nick Niemeir <nick.niemeir@gmail.com>',
  'Erkan Yilmaz <erkan77@gmail.com>',
  'Matt Niemeir <matt.niemeir@gmail.com>',
  'Daan van Berkel <daan.v.berkel.1980@gmail.com>',
  'Nicholas Hallahan <nick@theoutpost.io>',
  'Ola Bini <ola.bini@gmail.com>',
  'Danilo Sato <dtsato@gmail.com>',
  'Henning Schumann <henning.schumann@gmail.com>',
  'Michael Deardeuff <michael.deardeuff@gmail.com>',
  'Pete Hodgson <git@thepete.net>',
  'Marcin Cieslak <saper@saper.info>',
  'M. Kelley Harris (http://www.kelleyharris.com)',
  'Ryan Bennett <nomad.ry@gmail.com>',
  'Paul Rodwell <paul.rodwell@btinternet.com>',
  'David Turnbull <dturnbull@gmail.com>',
  'Austin King <shout@ozten.com>',
]

gitAuthors.updateAuthors(
  {
    priorAuthors: priorAuthors,
  },
  (error, filename) => {
    if (error) {
      console.log('Error: ', error)
    } else {
      console.log(filename, 'updated')
    }
  },
)
