# Cross-Border Crossing

Cross-Border Crossing is a small Frogger-inspired retro arcade MVP for a B2B payments concept. The player moves a glowing payment packet from the Buyer / Treasury Zone to the Supplier Zone while avoiding payment-friction lanes, riding safe payment rails, collecting Tracking Pings, and using route-focused power-ups.

## Run locally

Open `index.html` in a modern desktop browser. No build step, server, external images, sound assets, libraries, or game engines are required.

## Controls

- Arrow keys or WASD: move one tile
- Space: use the held power-up
- Enter: start, continue, or restart

## Gameplay

- Deliver payments to suppliers to complete each level.
- Friction lane collisions send the payment to the exception queue.
- Rail lanes carry the packet horizontally; missing a rail sends the payment to the exception queue.
- Processing Windows track available payment-processing attempts.
- Tracking Pings increase visibility.
- At 100% visibility, Transparency Trail activates automatically.

## Levels

1. Supplier Payment: deliver 1 payment.
2. Marketplace Payout: deliver 2 payments.
3. Month-End Run: deliver 3 payments, then view the business-outcome summary.

## Tuning

Most gameplay tuning is near the top of `game.js`:

- `LEVELS` controls goals, speed scaling, blocker density, and level bonuses.
- `BASE_LANES` controls lane labels, type, row, color, speed, direction, and object counts.
- `POWER_UPS` controls the power-up names, icons, and colors.
