util = require './util'
_ = require 'underscore'

# TODO: better home for asSlug
asSlug = (name) ->
  name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase()

emptyPage = ->
	createPage({}, null)

createPage = (json, site) ->
	page = _.extend {}, util.emptyPage(), json

	getRawPage = ->
		page

	getContext = ->
		context = ['view']
		context.push site if site?
		addContext = (site) -> context.push site if site? and not _.include context, site
		addContext action.site for action in page.journal.slice(0).reverse()
		context

	isPlugin = ->
		page.plugin?

	isRemote = ->
		! (site in [null, 'view', 'origin', 'local'])

	isLocal = ->
		site == 'local'

	getRemoteSite = ->
		return site if isRemote()
		null

	getSlug = ->
		asSlug page.title

	setTitle = (title) ->
		page.title = title 

	addItem = (item) ->
		item = _.extend {}, {id: util.randomBytes(8)}, item
		page.story.push item

		# page.journal.push {type: 'add'}


	{getRawPage, getContext, isPlugin, isRemote, isLocal, getRemoteSite, getSlug, setTitle, addItem}


module.exports = {createPage, emptyPage}