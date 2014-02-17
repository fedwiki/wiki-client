$dot = '';

$color{'format'} = $color{'random'} = 'paleGreen';

for $f (<../lib/*.coffee>) {
  $from = $1 if $f =~ /(\w+)\.coffee/;
  $color = $color{$from} || 'gold';
  $dot .= "\n$from [fillcolor=$color];\n";

  open F, $f;
  for (<F>) {
    if (/\brequire\b.+\.\/(\w+)\b/) {
      $dot .= "$1 -> $from;\n";

    }
  }
}

open D, '>requires.dot';
print D "digraph { node [style=filled shape=box];\n$dot}\n";