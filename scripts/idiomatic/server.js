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

const rules = {
  Program({body}) {body.map(parse)},
  VariableDeclaration({kind,declarations}) {declarations.map(parse)},
  VariableDeclarator({id,init}) {parse(id);if(init)parse(init)},
  Identifier({start,name}) {count(name); console.log(start,name)},
  CallExpression({callee}) {parse(callee); arguments[0]['arguments'].map(parse)},
  NewExpression({callee}) {parse(callee); arguments[0]['arguments'].map(parse)},
  FunctionExpression({params,body}) {params.map(parse); parse(body)},
  MemberExpression({object,property}) {parse(object); parse(property)},
  ObjectPattern({properties}) {properties.map(parse)},
  ExpressionStatement({expression}) {parse(expression)},
  IfStatement({test,consequent}) {parse(test); parse(consequent)},
  BlockStatement({body}) {body.map(parse)},
  ReturnStatement({argument}) {if(argument)parse(argument)},

  Literal({start,value,raw}) {console.log(start,raw)},
  AssignmentExpression({operator,left,right}) {console.log(operator);parse(left);parse(right)},
  LogicalExpression({operator,left,right}) {console.log(operator);parse(left);parse(right)},
  BinaryExpression({operator,left,right}) {console.log(operator);parse(left);parse(right)},
  UnaryExpression({operator,prefix,argument}) {console.log(prefix?'prefix':'suffix',operator); parse(argument)},
  UpdateExpression({operator,prefix,argument}) {console.log(prefix?'prefix':'suffix',operator); parse(argument)},
  ObjectExpression({properties}) {properties.map(parse)},
  Property({key,value}) {parse(key);parse(value)},
  ArrayExpression({elements}) {elements.map(parse)},
  ArrayPattern({elements}) {elements.map(parse)},
  ArrowFunctionExpression({params,body}) {params.map(parse);parse(body)},
  TemplateLiteral({expressions,quasis}) {quasis.map(parse);expressions.map(parse)},
  TemplateElement({start,end}) {console.log(end-start,'bytes')},

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

const tally = {}
function count(it) {tally[it] = (tally[it]||0) +1}

function parse(json) {
  if(json) {
    const type = json?.type;
    stack.unshift(json); 
    console.log('PARSING',type); 
    (rules[type]||fail)(json);
    stack.shift()
  }
}
function fail(json) {console.log('FAIL',json?.type,json?.start,Object.keys(json||{}))}

parse(trees.refresh)
parse(trees.page)


// I N T E R A C T I V E   E X P L O R E R

Deno.serve(async (req) => {

  function reply(opts) {
    const status = opts.status || 200
    const body = opts.body || "NOT FOUND"
    const headers = {"content-type": `${opts.type || 'text/plain'}; charset=utf-8`}
    return new Response(body,{status,headers})
  }

  if(req.method != 'GET') return reply({status:405,body:"Not Allowed"})
  const html = "text/html"
  const url = new URL(req.url);
  console.log("Query parameters:", url.searchParams);
  switch(url.pathname) {
  case '/':
  case '/identifiers':
    const body = Object.entries(tally)
      .sort((a,b) => a[1]==b[1] ? (a[0]>b[0] ? 1 : -1) : b[1]-a[1])
      .map(([k,v]) => `${v} ${k}`)
      .join("\n")
    return reply({body})
  default:
    return reply({status:400})
  }
});
