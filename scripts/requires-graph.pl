# read all source files in lib, generate graph of require dependencies
# usage: perl require-graph.pl

@new = qw" format random dom emit ";

for (<../lib/*.coffee>) {
  $from = $1 if /(\w+)\.coffee/;
  $color = $from ~~ @new ? 'paleGreen' : 'gold';
  $dot .= "\n$from [fillcolor=$color];\n";
  open F, $_;

  for (<F>) {
    if (/\brequire\b.+\.\/(\w+)\b/) {
      $dot .= "$1 -> $from [dir=back];\n";

    }
  }
}

open D, '>requires-graph.dot';
print D "digraph { node [style=filled shape=box];\n$dot}\n";