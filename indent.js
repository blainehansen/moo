(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['moo'], factory) /* global define */
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./moo'))
  } else {
    root.moo.indent = factory(root.moo)
  }
}(this, function(moo) {
  'use strict';

  function proxy(a, name) {
    a.prototype[name] = function() {
      return this.lexer[name].apply(this.lexer, arguments)
    }
  }

  function Indented(lexer, options) {
    this.options = Object.assign({
      // TODO
      // whitespace: 'ws',
      // newline: 'nl',
      // indent: 'indent',
      // dedent: 'dedent',
    }, options)
    this.lexer = lexer
    this.reset()
  }
  proxy(Indented, 'formatError')
  proxy(Indented, 'setState')
  proxy(Indented, 'has')

  Indented.prototype.clone = function() {
    return new Indented(this.lexer.clone(), this.options)
  }

  Indented.prototype.reset = function(data, info) {
    this.indent = info ? info.indent : null
    this.stack = info ? info.stack.slice() : []
    this.queue = info ? info.queue.slice() : []
    this.lexer.reset(data, info)
    this.here = info ? info.here : null
  }

  Indented.prototype.save = function() {
    return Object.assign(this.lexer.save(), {
      here: this.here,
      indent: this.indent,
      stack: this.stack.slice(),
      queue: this.queue.slice(),
    })
  }

  Indented.prototype._peek = function() {
    return this.here || (this.here = this.lexer.next())
  }

  Indented.prototype._next = function() {
    if (this.here) {
      var old = this.here
      this.here = null
      return old
    }
    return this.lexer.next()
  }

  Indented.prototype._nextIndent = function() {
    for (var tok; tok = this._peek(); ) {
      if (tok.type === 'nl') {
        this._next()
        continue
      }
      if (tok.type === 'ws') {
        var indent = tok.value.length
        this._next()

        var next = this._peek()
        if (!next) return
        if (next.type === 'nl') {
          this._next()
          continue
        }
        return indent
      }
      return 0
    }
  }

  Indented.prototype.next = function() {
    if (this.indent === null) {
      // absorb initial blank lines and indentation
      this.indent = this._nextIndent()
    }
    if (this.queue.length) {
      return this.queue.shift()
    }

    var tok
    while (tok = this._next()) {
      if (tok.type === 'nl') {
        var newIndent = this._nextIndent()
        if (newIndent == null) break // eof

        if (newIndent === this.indent) {
          this.indent = newIndent
          return {type: 'nl'} // TODO tok?

        } else if (newIndent > this.indent) {
          this.stack.push(this.indent)
          this.indent = newIndent
          return {type: 'indent'}

        } else {
          while (newIndent < this.indent) {
            this.indent = this.stack.pop()
            this.queue.push({type: 'dedent'})
          }
          if (newIndent !== this.indent) {
            throw new Error('inconsistent indentation')
          }
          this.indent = newIndent
          return this.queue.shift()
        }

      // ignore whitespace within lines
      } else if (tok.type !== 'ws') {
        return tok
      }
    }

    // dedent remaining blocks at eof
    for (let i = this.stack.length; i--; ) {
      this.queue.push({type: 'dedent'})
    }
    this.stack = []
    if (this.queue.length) return this.queue.shift()
  }

  if (typeof Symbol !== 'undefined' && Symbol.iterator) {
    var lexer = moo.compile([])
    var iter = lexer[Symbol.iterator]()
    var LexerIterator = iter.constructor
    Indented.prototype[Symbol.iterator] = function() {
      return new LexerIterator(this)
    }
  }


  return function indented(lexer, options) {
    return new Indented(lexer, options)
  }

}))