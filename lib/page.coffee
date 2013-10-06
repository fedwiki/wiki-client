util = require './util'
_ = require 'underscore'

# TODO: better home for asSlug
asSlug = (name) ->
  name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase()

emptyPage = ->
	createPage({}, null)

createPage = (json, site) ->
	page = _.extend {}, util.emptyPage(), json
	page.story ||= []
	page.journal ||= []
	page.id ||= util.randomBytes(8)

	getRawPage = ->
		page

	getContext = ->
		context = ['view']
		context.push site if isRemote()
		addContext = (site) -> context.push site if site? and not _.include context, site
		addContext action.site for action in page.journal.slice(0).reverse()
		context

	isPlugin = ->
		page.plugin?

	isRemote = ->
		! (site in [undefined, null, 'view', 'origin', 'local'])

	isLocal = ->
		site == 'local'

	getRemoteSite = ->
		return site if isRemote()
		null

	getSlug = ->
		asSlug page.title

	getNeighbors = (host) ->
		neighbors = []
		if _.include ['local', 'origin', 'view', null, undefined], site
      neighbors.push host if host?
    else
      neighbors.push site
    for item in page.story
      neighbors.push item.site if item.site?
    for action in page.journal
      neighbors.push action.site if action.site?
    _.uniq neighbors

	setTitle = (title) ->
		page.title = title 

	addItem = (item) ->
		item = _.extend {}, {id: util.randomBytes(8)}, item
		page.story.push item

	addParagraph = (text) ->
		type = "paragraph"
		addItem {type, text}

		# page.journal.push {type: 'add'}


	{getRawPage, getContext, isPlugin, isRemote, isLocal, getRemoteSite, getSlug, getNeighbors, setTitle, addItem, addParagraph}


module.exports = {createPage, emptyPage}