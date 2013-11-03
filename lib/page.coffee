util = require './util'
_ = require 'underscore'

# TODO: better home for asSlug
asSlug = (name) ->
  name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase()

emptyPage = ->
	newPage({}, null)

newPage = (json, site) ->
	page = _.extend {}, util.emptyPage(), json
	page.story ||= []
	page.journal ||= []

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
    if isRemote()
      neighbors.push site
    else
      neighbors.push host if host?
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

	seqItems = (each) ->
        emitItem = (i) ->
            return if i >= page.story.length
            console.log 'syncItem', i, page.story[i].type
            each page.story[i], -> emitItem i+1
        emitItem 0

	addParagraph = (text) ->
		type = "paragraph"
		addItem {type, text}

		# page.journal.push {type: 'add'}

	seqActions = (each) ->
		emitAction = (i) ->
			return if i >= page.journal.length
			console.log 'syncAction', i, page.journal[i].type
			each page.journal[i], -> emitAction i+1
		emitAction 0


	{getRawPage, getContext, isPlugin, isRemote, isLocal, getRemoteSite, getSlug, getNeighbors, setTitle, addItem, addParagraph, seqItems, seqActions}


module.exports = {newPage, emptyPage}