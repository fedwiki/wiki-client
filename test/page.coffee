newPage = require('../lib/page').newPage
expect = require 'expect.js'

describe 'page', ->

	describe 'newly created', ->

		it 'should start empty', -> 	
			pageObject = newPage()
			expect(pageObject.getSlug()).to.eql('empty')

		it 'should not be remote', ->
			pageObject = newPage()
			expect(pageObject.isRemote()).to.be.false

		it 'should have default contex', ->
			pageObject = newPage()
			expect(pageObject.getContext()).to.eql(['view'])

	describe 'from json', ->

		it 'should have a title', ->
			pageObject = newPage
				title: "New Page"
			expect(pageObject.getSlug()).to.eql('new-page')

		it 'should have a default context', ->
			pageObject = newPage
				title: "New Page"
			expect(pageObject.getContext()).to.eql(['view'])

		it 'should have context from site and (reversed) journal', ->
			pageObject = newPage
				journal: [
					{ type: 'fork', site: 'one.org'},
					{	type: 'fork', site: 'two.org'}
				], 'example.com'
			expect(pageObject.getContext()).to.eql(['view','example.com','two.org','one.org'])

		it 'should have context without duplicates', ->
			pageObject = newPage
				journal: [
					{ type: 'fork', site: 'one.org'},
					{	type: 'fork', site: 'one.org'}
				], 'example.com'
			expect(pageObject.getContext()).to.eql(['view','example.com','one.org'])

		it 'should have neighbors from site, reference and journal (in order, without duplicates)', ->
			pageObject = newPage
				story: [
					{ type: 'reference', site: 'one.org' },
					{ type: 'reference', site: 'two.org' },
					{ type: 'reference', site: 'one.org' }
				]
				journal: [
					{ type: 'fork', site: 'three.org'},
					{	type: 'fork', site: 'four.org'},
					{	type: 'fork', site: 'three.org'}
				], 'example.com'
			expect(pageObject.getNeighbors()).to.eql(['example.com','one.org','two.org','three.org','four.org'])	



