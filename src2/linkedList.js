function ll(){
  this.last = this.first = null;

  var remove = function(){
    var t = this, l = t.list;
    l.first = (t == l.first ? t.next : l.first);
    l.last  = (t == l.last  ? t.prev : l.last);
    if(t.prev) t.prev.next = t.next;
    if(t.next) t.next.prev = t.prev;
    return t.value;
  };
  
  this.add = function(value){
    node = {list: this, value: value, next: null, prev: this.last, remove: remove};
    this.first = this.first ? this.first : node;
    if(this.last) this.last.next = node;
    this.last = node;
    return node;
  };
  
  this.remove = function(node){ node.remove; };
  
  return this;
}