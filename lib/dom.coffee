module.exports = dom = {}

dom.getItem = (element) ->
  $(element).data("item") or $(element).data('staticItem') if $(element).length > 0
