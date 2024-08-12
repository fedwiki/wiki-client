/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const drop = require('../lib/drop');
const expect = require('expect.js');

// construct mock event objects

const signal = (mock, handler) => handler(mock);

const mockDrop = dataTransfer => ({
  preventDefault() {},
  stopPropagation() {},

  originalEvent: {
    dataTransfer
  }
});

const mockUrl = (type, url) => mockDrop({
  types: [type],
  getData(spec) { return url; }
});

const mockFile = spec => mockDrop({
  types: ['File'],
  files: [spec]});

// test the handling of mock events

describe('drop', function() {

  it('should handle remote pages', function() {
    const event = mockUrl('text/uri-list', 'http://localhost:3000/fed.wiki.org/welcome-visitors');
    return signal(event, drop.dispatch({
      page(page) { return expect(page).to.eql({slug: 'welcome-visitors', site: 'fed.wiki.org'}); }})
    );
  });

  it('should handle local pages', function() {
    const event = mockUrl('text/uri-list', 'http://fed.wiki.org/view/welcome-visitors');
    return signal(event, drop.dispatch({
      page(page) { return expect(page).to.eql({slug: 'welcome-visitors', site: 'fed.wiki.org'}); }})
    );
  });

  it('should handle list of pages', function() {
    const event = mockUrl('text/uri-list', 'http://sfw.c2.com/view/welcome-visitors/view/pattern-language');
    return signal(event, drop.dispatch({
      page(page) { return expect(page).to.eql({slug: 'pattern-language', site: 'sfw.c2.com'}); }})
    );
  });

  it('should handle a YouTube video', function() {
    const event = mockUrl('text/uri-list', 'https://www.youtube.com/watch?v=rFpDK2KhAgw');
    return signal(event, drop.dispatch({
      video(video) { return expect(video).to.eql({text: 'YOUTUBE rFpDK2KhAgw'}); }})
    );
  });

  it('should handle a YouTube playlist', function() {
    const event = mockUrl('text/uri-list', 'https://www.youtube.com/watch?v=ksoe4Un7bLo&list=PLze65Ckn-WXZpRzLeUPxqsEkFY6vt2hF7');
    return signal(event, drop.dispatch({
      video(video) { return expect(video).to.eql({text: 'YOUTUBE PLAYLIST PLze65Ckn-WXZpRzLeUPxqsEkFY6vt2hF7'}); }})
    );
  });

  it('should handle a YouTu.be video', function() {
    const event = mockUrl('text/uri-list', 'https://youtu.be/z2p4VRKgQYU');
    return signal(event, drop.dispatch({
      video(video) { return expect(video).to.eql({text: 'YOUTUBE z2p4VRKgQYU'}); }})
    );
  });

  it('should handle a YouTu.be playlist', function() {
    const event = mockUrl('text/uri-list', 'https://youtu.be/pBu6cixcaxI?list=PL0LQM0SAx601_99m2E2NPsm62pKoSCnV5');
    return signal(event, drop.dispatch({
      video(video) { return expect(video).to.eql({text: 'YOUTUBE PLAYLIST PL0LQM0SAx601_99m2E2NPsm62pKoSCnV5'}); }})
    );
  });

  it('should handle a vimeo video', function() {
    const event = mockUrl('text/uri-list', 'https://vimeo.com/90834988');
    return signal(event, drop.dispatch({
      video(video) { return expect(video).to.eql({text: 'VIMEO 90834988'}); }})
    );
  });

  it('should handle a archive.org video', function() {
    const event = mockUrl('text/uri-list', 'https://archive.org/details/IcelandJazz');
    return signal(event, drop.dispatch({
      video(video) { return expect(video).to.eql({text: 'ARCHIVE IcelandJazz'}); }})
    );
  });

  it('should handle a TEDX video', function() {
    const event = mockUrl('text/uri-list', 'http://tedxtalks.ted.com/video/Be-a-Daydream-Believer-Anne-Zac');
    return signal(event, drop.dispatch({
      video(video) { return expect(video).to.eql({text: 'TEDX Be-a-Daydream-Believer-Anne-Zac'}); }})
    );
  });

  it('should handle a TED video', function() {
    const event = mockUrl('text/uri-list', 'http://www.ted.com/talks/david_camarillo_why_helmets_don_t_prevent_concussions_and_what_might');
    return signal(event, drop.dispatch({
      video(video) { return expect(video).to.eql({text: 'TED david_camarillo_why_helmets_don_t_prevent_concussions_and_what_might'}); }})
    );
  });

  return it('should handle text file', function() {
    const file = {name: "foo.txt", type: "text/plain"};
    const event = mockFile(file);
    return signal(event, drop.dispatch({
      file(data) { return expect(data).to.eql(file); }})
    );
  });
});
