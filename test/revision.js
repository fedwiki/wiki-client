const { newPage } = require('../lib/page')
const revision = require('../lib/revision')
const expect = require('expect.js')

// fixture -- create proper pages from model pages

const id = i => `${i}0`

const item = function (i, n = '') {
  return { type: 'paragraph', text: `t${i}${n}`, id: id(i) }
}

const action = function (a) {
  let t, v
  let i
  if (typeof a !== 'string') {
    return a
  }
  ;[t, i, ...v] = a.split('')
  switch (t) {
    case 'c':
      return {
        type: 'create',
        id: id(i),
        item: {
          title: `Create ${v}`,
          story: v.map(i => item(i)),
        },
      }
    case 'a':
      if (v[0]) {
        return { type: 'add', id: id(i), item: item(i), after: id(v[0]) }
      } else {
        return { type: 'add', id: id(i), item: item(i) }
      }
    case 'r':
      return { type: 'remove', id: id(i) }
    case 'e':
      return { type: 'edit', id: id(i), item: item(i, 'edited') }
    case 'm':
      return { type: 'move', id: id(i), order: v.map(j => id(j)) }
    default:
      throw `can't model '${t}' action`
  }
}

const fixture = function (model) {
  model.title = model.title || `About ${model.story || model.journal}`
  model.story = (model.story || []).map(i => item(i))
  model.journal = (model.journal || []).map(a => action(a))
  return model
}

const expectText = version => expect(version.story.map(each => each.text))

describe('revision', function () {
  describe('testing helpers', function () {
    describe('action', function () {
      it('should make create actions', () =>
        expect(action('c312')).to.eql({
          type: 'create',
          id: '30',
          item: {
            title: 'Create 1,2',
            story: [
              { type: 'paragraph', text: 't1', id: '10' },
              { type: 'paragraph', text: 't2', id: '20' },
            ],
          },
        }))

      it('should make empty create actions', () =>
        expect(action('c0')).to.eql({ type: 'create', id: '00', item: { title: 'Create ', story: [] } }))

      it('should make add actions', () =>
        expect(action('a3')).to.eql({ type: 'add', id: '30', item: { type: 'paragraph', text: 't3', id: '30' } }))

      it('should make add after actions', () =>
        expect(action('a31')).to.eql({
          type: 'add',
          id: '30',
          item: { type: 'paragraph', text: 't3', id: '30' },
          after: '10',
        }))

      it('should make remove actions', () => expect(action('r3')).to.eql({ type: 'remove', id: '30' }))

      it('should make edit actions', () =>
        expect(action('e3')).to.eql({
          type: 'edit',
          id: '30',
          item: { type: 'paragraph', text: 't3edited', id: '30' },
        }))

      it('should make move actions', () =>
        expect(action('m1321')).to.eql({ type: 'move', id: '10', order: ['30', '20', '10'] }))
    })

    describe('fixture', function () {
      const data = fixture({
        story: [1, 2, 3],
        journal: ['c12', 'a3', { type: 'foo' }],
      })

      it('should make stories with text', () => expect(data.story.map(e => e.text)).to.eql(['t1', 't2', 't3']))

      it('should make stories with ids', () => expect(data.story.map(e => e.id)).to.eql(['10', '20', '30']))

      it('should make journals with actions', () =>
        expect(data.journal.map(a => a.type)).to.eql(['create', 'add', 'foo']))

      it('should make titles from the model', () => expect(data.title).to.be('About 1,2,3'))
    })
  })

  describe('applying actions', function () {
    it('should create a story', function () {
      let page
      revision.apply((page = {}), { type: 'create', item: { story: [{ type: 'foo' }] } })
      expect(page.story).to.eql([{ type: 'foo' }])
    })

    it('should add an item', function () {
      let page
      revision.apply((page = {}), { type: 'add', item: { type: 'foo' } })
      expect(page.story).to.eql([{ type: 'foo' }])
    })

    it('should edit an item', function () {
      let page
      revision.apply((page = { story: [{ type: 'foo', id: '3456' }] }), {
        type: 'edit',
        id: '3456',
        item: { type: 'bar', id: '3456' },
      })
      expect(page.story).to.eql([{ type: 'bar', id: '3456' }])
    })

    it('should move first item to the bottom', function () {
      const page = {
        story: [
          { type: 'foo', id: '1234' },
          { type: 'bar', id: '3456' },
        ],
      }
      revision.apply(page, { type: 'move', id: '1234', order: ['3456', '1234'] })
      expect(page.story).to.eql([
        { type: 'bar', id: '3456' },
        { type: 'foo', id: '1234' },
      ])
    })

    it('should move last item to the top', function () {
      const page = {
        story: [
          { type: 'foo', id: '1234' },
          { type: 'bar', id: '3456' },
        ],
      }
      revision.apply(page, { type: 'move', id: '3456', order: ['3456', '1234'] })
      expect(page.story).to.eql([
        { type: 'bar', id: '3456' },
        { type: 'foo', id: '1234' },
      ])
    })

    it('should remove an item', function () {
      const page = {
        story: [
          { type: 'foo', id: '1234' },
          { type: 'bar', id: '3456' },
        ],
      }
      revision.apply(page, { type: 'remove', id: '1234' })
      expect(page.story).to.eql([{ type: 'bar', id: '3456' }])
    })
  })

  describe('creating revisions', function () {
    describe('titling', function () {
      it('should use create title if present', function () {
        const data = fixture({ journal: ['c0123'] })
        const version = revision.create(0, data)
        expect(version.title).to.eql('Create 1,2,3')
      })

      it('should use existing title if create title absent', function () {
        const data = fixture({ title: 'Foo', journal: [{ type: 'create', item: { story: [] } }] })
        const version = revision.create(0, data)
        expect(version.title).to.eql('Foo')
      })
    })

    describe('sequencing', function () {
      const data = fixture({
        story: [1, 2, 3],
        journal: ['a1', 'a21', 'a32'],
      })

      it('should do little to an empty page', function () {
        const emptyPage = newPage({}).getRawPage()
        const version = revision.create(-1, emptyPage)
        expect(newPage(version).getRawPage()).to.eql(emptyPage)
      })

      it('should shorten the journal to given revision', function () {
        const version = revision.create(1, data)
        expect(version.journal.length).to.be(2)
      })

      it('should recreate story on given revision', function () {
        const version = revision.create(1, data)
        expectText(version).to.eql(['t1', 't2'])
      })

      it('should accept revision as string', function () {
        const version = revision.create('1', data)
        expect(version.journal.length).to.be(2)
      })
    })

    describe('workflows', function () {
      describe('dragging item from another page', function () {
        it('should place story item on dropped position', function () {
          const data = fixture({
            journal: ['c0135', 'a21', 'a43'],
          })
          const version = revision.create(3, data)
          expectText(version).to.eql(['t1', 't2', 't3', 't4', 't5'])
        })

        it('should place story items at the beginning when dropped position is not defined', function () {
          const data = fixture({
            journal: ['c0135', 'a2', 'a4'],
          })
          const version = revision.create(3, data)
          expectText(version).to.eql(['t4', 't2', 't1', 't3', 't5'])
        })
      })

      describe('editing items', function () {
        it('should replace edited stories item', function () {
          const data = fixture({
            journal: ['c012345', 'e3', 'e1'],
          })
          const version = revision.create(3, data)
          expectText(version).to.eql(['t1edited', 't2', 't3edited', 't4', 't5'])
        })

        it('should place item at end if edited item is not found', function () {
          const data = fixture({
            journal: ['c012345', 'e9'],
          })
          const version = revision.create(2, data)
          expectText(version).to.eql(['t1', 't2', 't3', 't4', 't5', 't9edited'])
        })
      })

      describe('reordering items', function () {
        it('should move item up', function () {
          const data = fixture({
            journal: ['c012345', 'm414235'],
          })
          const version = revision.create(2, data)
          expectText(version).to.eql(['t1', 't4', 't2', 't3', 't5'])
        })

        it('should move item to top', function () {
          const data = fixture({
            journal: ['c012345', 'm441235'],
          })
          const version = revision.create(2, data)
          expectText(version).to.eql(['t4', 't1', 't2', 't3', 't5'])
        })

        it('should move item down', function () {
          const data = fixture({
            journal: ['c012345', 'm213425'],
          })
          const version = revision.create(2, data)
          expectText(version).to.eql(['t1', 't3', 't4', 't2', 't5'])
        })
      })

      describe('deleting items', () =>
        it('should remove the story items', function () {
          const data = fixture({
            journal: ['c012345', 'r4', 'r2'],
          })
          const version = revision.create(3, data)
          expectText(version).to.eql(['t1', 't3', 't5'])
        }))
    })
  })
})
