// Browse javascript idioms present in ./lib/*.js codebase
// cd scripts/idiomatic; deno run --allow-net --allow-read=. idiomatic.js

// see https://astexplorer.net
// see https://docs.deno.com/runtime/fundamentals/http_server/


// A B S T R A C T   S Y N T A X   T R E E S

const modules = ['page','refresh']
const entries = await Promise.all(modules.map(load))
const trees = Object.fromEntries(entries)

async function load(module) {
  const text = await Deno.readTextFile(`${module}.json`)
  const tree = JSON.parse(text)
  return [module,tree]
}


// T R E E   W A L K I N G   V I S I T O R

const stack=[]
const log = false ? console.log : () => null
let doit = () => null

const rules = {
  Program({body}) {body.map(parse)},
  VariableDeclaration({kind,declarations}) {declarations.map(parse)},
  VariableDeclarator({id,init}) {parse(id);if(init)parse(init)},
  Identifier({start,name}) {doit(name); log(start,name)},
  CallExpression({callee}) {parse(callee); arguments[0]['arguments'].map(parse)},
  NewExpression({callee}) {parse(callee); arguments[0]['arguments'].map(parse)},
  FunctionExpression({params,body}) {params.map(parse); parse(body)},
  MemberExpression({object,property}) {parse(object); parse(property)},
  ObjectPattern({properties}) {properties.map(parse)},
  ExpressionStatement({expression}) {parse(expression)},
  IfStatement({test,consequent}) {parse(test); parse(consequent)},
  BlockStatement({body}) {body.map(parse)},
  ReturnStatement({argument}) {if(argument)parse(argument)},

  Literal({start,value,raw}) {log(start,raw)},
  AssignmentExpression({operator,left,right}) {log(operator);parse(left);parse(right)},
  LogicalExpression({operator,left,right}) {log(operator);parse(left);parse(right)},
  BinaryExpression({operator,left,right}) {log(operator);parse(left);parse(right)},
  UnaryExpression({operator,prefix,argument}) {log(prefix?'prefix':'suffix',operator); parse(argument)},
  UpdateExpression({operator,prefix,argument}) {log(prefix?'prefix':'suffix',operator); parse(argument)},
  ObjectExpression({properties}) {properties.map(parse)},
  Property({key,value}) {parse(key);parse(value)},
  ArrayExpression({elements}) {elements.map(parse)},
  ArrayPattern({elements}) {elements.map(parse)},
  ArrowFunctionExpression({params,body}) {params.map(parse);parse(body)},
  TemplateLiteral({expressions,quasis}) {quasis.map(parse);expressions.map(parse)},
  TemplateElement({start,end}) {log(end-start,'bytes')},

  ForStatement({init,test,update,body}) {parse(init);parse(test);parse(update);parse(body)},
  ForInStatement({left,right,body}) {parse(left); parse(right); parse(body)},
  ForOfStatement({left,right,body}) {parse(left); parse(right); parse(body)},
  ChainExpression({expression}) {parse(expression)},
  ConditionalExpression({test,consequent,alternative}) {parse(test);parse(consequent);parse(alternative)},
  ContinueStatement(){},
  BreakStatement(){},

  AssignmentPattern({left,right}) {parse(left);parse(right)},
  WhileStatement({test,body}) {parse(test);parse(body)},
  TryStatement({block,handler,finalizer}) {parse(block);parse(handler);parse(finalizer)},
  CatchClause({param,body}) {parse(param);parse(body)}
}

let tally = {}
function count(it) {tally[it] = (tally[it]||0) +1}
function parse(json) {
  if(json) {
    const type = json?.type;
    stack.unshift(json); 
    log('PARSING',type);
    (rules[type]||fail)(json);
    stack.shift()
  }
}
function fail(json) {console.log('FAIL',json?.type,json?.start,Object.keys(json||{}))}

function parseall(lambda) {
  tally = {}
  doit = lambda
  stack.push('page'); parse(trees.page); stack.pop()
  stack.push('refresh'); parse(trees.refresh); stack.pop()
}




// I N T E R A C T I V E   E X P L O R E R

Deno.serve(async (req) => {

  const plain = "text/plain"

  function reply(opts) {
    const status = opts.status || 200
    const body = opts.body || "NOT FOUND"
    const headers = {"content-type": `${opts.type || 'text/html'}; charset=utf-8`}
    return new Response(body,{status,headers})
  }


  if(req.method != 'GET') return reply({status:405,body:"Not Allowed"})
  const url = new URL(req.url);
  const id = url.searchParams.get('id')
  const type = url.searchParams.get('type')
  switch(url.pathname) {
    case '/': return reply({body:identifiers()})
    case '/context': return reply({body:context(id)})
    case '/example': return reply({body:example(id,type)})
    default: return reply({status:400})
  }
});

function identifiers() {
  parseall(name => count(name))
  return Object.entries(tally)
    .sort((a,b) => a[1]==b[1] ? (a[0]>b[0] ? 1 : -1) : b[1]-a[1])
    .map(([k,v]) => `${v} <a href="/context?id=${k}">${k}</a><br>`)
    .join("\n")
}
function context(id) {
  parseall(name => { if(name==id) count(stack[1].type) })
  return `<b>${id} ⇒</b><br>` + Object.entries(tally)
    .sort((a,b) => a[1]==b[1] ? (a[0]>b[0] ? 1 : -1) : b[1]-a[1])
    .map(([k,v]) => `${v} <a href="/example?id=${id}&type=${k}">${k}</a><br>`)
    .join("\n")
}
function example(id,type) {
  parseall(name => { if(name==id && stack[1].type==type) count(`${stack.at(-1)} ${stack[1].start}-${stack[1].end}`) })
  return `<b>${id} ⇒ ${type} ⇒</b><br>` + Object.entries(tally)
    .map(([k,v]) => `${k}<br>`)
    .join("\n")
}
