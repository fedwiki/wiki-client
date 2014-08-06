{newPage} = require('../lib/page')
revision = require '../lib/revision'
expect = require 'expect.js'

# fixture -- create proper pages from model pages

id = (i) ->
  "#{i}0"

item = (i,n='') ->
  {type:'paragraph', text:"t#{i}#{n}", id:id(i)}

action = (a) ->
  return a if typeof a != 'string'
  [t, i, v...] = a.split ''
  switch t
    when 'c' then {type:'create', id:id(i), item:{title:"Create #{v}", story:(item i for i in v)}}
    when 'a'
      if v[0]?
        {type:'add', id:id(i), item:item(i), after:id(v[0])}
      else
        {type:'add', id:id(i), item:item(i)}
    when 'r' then {type:'remove', id:id(i)}
    when 'e' then {type:'edit', id:id(i), item:item(i,'edited')}
    when 'm' then {type:'move', id:id(i), order:(id(j) for j in v)}
    else throw "can't model '#{t}' action"

fixture = (model) ->
  model.title = model.title || "About #{model.story || model.journal}"
  model.story = (item i for i in model.story || [])
  model.journal = (action a for a in model.journal || [])
  model

expectText = (version) ->
  expect((each.text for each in version.story))

describe 'revision', ->

  describe 'testing helpers', ->

    describe 'action', ->

      it 'should make create actions', ->
        expect(action('c312')).to.eql {type: 'create', id: '30', item: {title: "Create 1,2", story:[{type: 'paragraph', text: 't1', id: '10'},{type: 'paragraph', text: 't2', id: '20'}]}}

      it 'should make empty create actions', ->
        expect(action('c0')).to.eql {type: 'create', id: '00', item: {title: "Create ", story:[]}}

      it 'should make add actions', ->
        expect(action('a3')).to.eql {type: 'add', id: '30', item: {type: 'paragraph', text: 't3', id: '30'}}

      it 'should make add after actions', ->
        expect(action('a31')).to.eql {type: 'add', id: '30', item: {type: 'paragraph', text: 't3', id: '30'}, after: '10'}

      it 'should make remove actions', ->
        expect(action('r3')).to.eql {type: 'remove', id: '30'}

      it 'should make edit actions', ->
        expect(action('e3')).to.eql {type: 'edit', id: '30', item: {type: 'paragraph', text: 't3edited', id: '30'}}

      it 'should make move actions', ->
        expect(action('m1321')).to.eql {type: 'move', id: '10', order:['30','20','10']}

    describe 'fixture', ->

      data = fixture
        story: [1, 2, 3]
        journal: ['c12', 'a3', {type: 'foo'}]

      it 'should make stories with text', ->
        expect((e.text for e in data.story)).to.eql ['t1', 't2', 't3']

      it 'should make stories with ids', ->
        expect((e.id for e in data.story)).to.eql ['10', '20', '30']

      it 'should make journals with actions', ->
        expect((a.type for a in data.journal)).to.eql ['create', 'add', 'foo']

      it 'should make titles from the model', ->
        expect(data.title).to.be 'About 1,2,3'

  describe 'applying actions', ->

    it 'should create a story', ->
      revision.apply (page = {}), {type: 'create', item: {story: [{type: 'foo'}]}}
      expect(page.story).to.eql [{type: 'foo'}]

    it 'should add an item', ->
      revision.apply (page = {}), {type: 'add', item: {type: 'foo'}}
      expect(page.story).to.eql [{type: 'foo'}]

    it 'should edit an item', ->
      revision.apply (page = {story:[{type:'foo',id:'3456'}]}), {type:'edit', id:'3456',item: {type:'bar',id:'3456'}}
      expect(page.story).to.eql [{type: 'bar', id:'3456'}]

    it 'should move first item to the bottom', ->
      page =
        story: [
          {type:'foo', id:'1234'}
          {type:'bar', id:'3456'}
        ]
      revision.apply page, {type: 'move', id:'1234', order:['3456','1234']}
      expect(page.story).to.eql [{type:'bar', id:'3456'},{type:'foo', id:'1234'}]

    it 'should move last item to the top', ->
      page =
        story: [
          {type:'foo', id:'1234'}
          {type:'bar', id:'3456'}
        ]
      revision.apply page, {type: 'move', id:'3456', order:['3456','1234']}
      expect(page.story).to.eql [{type:'bar', id:'3456'},{type:'foo', id:'1234'}]

    it 'should remove an item', ->
      page =
        story: [
          {type:'foo', id:'1234'}
          {type:'bar', id:'3456'}
        ]
      revision.apply page, {type:'remove', id:'1234'}
      expect(page.story).to.eql [{type:'bar', id:'3456'}]


  describe 'creating revisions', ->

    describe 'titling', ->

      it 'should use create title if present', ->
        data = fixture {journal: ['c0123']}
        version = revision.create 0, data
        expect(version.title).to.eql('Create 1,2,3')

      it 'should use existing title if create title absent', ->
        data = fixture {title: 'Foo', journal: [{type: 'create', item: {story: []}}]}
        version = revision.create 0, data
        expect(version.title).to.eql('Foo')

    describe 'sequencing', ->
      data = fixture
        story:[1,2,3]
        journal:['a1','a21','a32']

      it 'should do little to an empty page', ->
        emptyPage = newPage({}).getRawPage()
        version = revision.create -1, emptyPage
        expect(newPage(version).getRawPage()).to.eql(emptyPage)

      it 'should shorten the journal to given revision', ->
        version = revision.create 1, data
        expect(version.journal.length).to.be(2)

      it 'should recreate story on given revision', ->
        version = revision.create 1, data
        expectText(version).to.eql ['t1', 't2']

      it 'should accept revision as string', ->
        version = revision.create '1', data
        expect(version.journal.length).to.be(2)

    describe 'workflows', ->

      describe 'dragging item from another page', ->
        it 'should place story item on dropped position', ->
          data = fixture
            journal:['c0135','a21','a43']
          version = revision.create 3, data
          expectText(version).to.eql ['t1','t2','t3','t4','t5']

        it 'should place story items at the beginning when dropped position is not defined', ->
          data = fixture
            journal:['c0135','a2','a4']
          version = revision.create 3, data
          expectText(version).to.eql ['t4','t2','t1','t3','t5']

      describe 'editing items', ->

        it 'should replace edited stories item', ->
          data = fixture
            journal:['c012345','e3','e1']
          version = revision.create 3, data
          expectText(version).to.eql ['t1edited','t2','t3edited','t4','t5']

        it 'should place item at end if edited item is not found', ->
          data = fixture
            journal:['c012345','e9']
          version = revision.create 2, data
          expectText(version).to.eql ['t1','t2','t3','t4','t5','t9edited',]

      describe 'reordering items', ->

        it 'should move item up', ->
          data = fixture
            journal:['c012345','m414235']
          version = revision.create 2, data
          expectText(version).to.eql ['t1','t4','t2','t3','t5']

        it 'should move item to top', ->
          data = fixture
            journal:['c012345','m441235']
          version = revision.create 2, data
          expectText(version).to.eql ['t4','t1','t2','t3','t5']

        it 'should move item down', ->
          data = fixture
            journal:['c012345','m213425']
          version = revision.create 2, data
          expectText(version).to.eql ['t1','t3','t4','t2','t5']

      describe 'deleting items', ->
        it 'should remove the story items', ->
          data = fixture
            journal:['c012345','r4', 'r2']
          version = revision.create 3, data
          expectText(version).to.eql ['t1','t3','t5']
