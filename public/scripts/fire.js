// This function defines the Gem module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the gem
// - `y` - The initial y position of the gem
// - `color` - The colour of the gem
const Fire = function(ctx, pos) {

    // This is the sprite sequences of the gem of four colours
    // `green`, `red`, `yellow` and `purple`.
    const sequences = {
        burning:  { x: 0, y:  160, width: 16, height: 16, count: 8, timing: 200, loop: true },
    };

    // This is the sprite object of the gem created from the Sprite module.
    const sprite = Sprite(ctx, pos[0], pos[1]);

    // The sprite object is configured for the gem sprite here.
    sprite.setSequence(sequences.burning)
          .setScale(2)
          .setShadowScale({ x: 0.75, y: 0.2 })
          .useSheet("./src/object_sprites.png");

    // The methods are returned as an object here.
    return {
        getXY: sprite.getXY,
        setXY: sprite.setXY,
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update: sprite.update
    };
};