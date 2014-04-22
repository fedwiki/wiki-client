# read all source files in lib, generate graph of require dependencies
# usage: perl require-graph.pl

@new = qw" page lineup drop dialog link tempwiki neighbors searchbox bind ";

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

# for (<../test/*.coffee>) {
#   $from = $1 if /(\w+)\.coffee/;
#   $color = 'lightBlue';
#   $dot .= "\n\"test\\n$from\" [fillcolor=$color];\n";
#   open F, $_;

#   for (<F>) {
#     if (/\brequire\b.+\.\.\/lib\/(\w+)\b/) {
#       $dot .= "$1 -> \"test\\n$from\" [dir=back];\n";

#     }
#   }
# }

open D, '>requires-graph.dot';
print D "digraph { node [style=filled shape=box];\n$dot}\n";