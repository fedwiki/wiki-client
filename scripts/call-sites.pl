$dep = "pageHandler|plugin|state|neighborhood|addToJournal|actionSymbols|lineup|resolve|random|pageModule|newPage|asSlug";


@lines = `cat lib/refresh.coffee`;
print "digraph {\nrankdir=LR;\nnode [style=filled; fillcolor=lightBlue];\n";
for (@lines) {
  next if /require/;
  next if /^#/;
  $from = $1 if /^\s*(\w+)\s*=\s*(\(|->)/;
  while (/\b($dep)\b/g) {
    print "$from -> $1;\n" if $from;
  }
}
print "}\n";