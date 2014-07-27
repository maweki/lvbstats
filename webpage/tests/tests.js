QUnit.test( "Main Object", function( assert ) {
  assert.ok( !_.isUndefined(lvbdata), "exists" );
  assert.ok(_.isPlainObject(lvbdata), "is plain object");
  assert.ok(!_.isEmpty(lvbdata), "is non-empty" );
});
