const defaultAdapter = require('../../../../lib/adapters/default');

it('defaultAdapter should be an object', () => {
    (typeof defaultAdapter === 'object').should.equal(true);
});
