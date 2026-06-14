/**
 * Find the optimal contiguous block of seats around a clicked seat.
 *
 * Algorithm:
 * 1. Filter all available seats in the same row as the clicked seat.
 * 2. Sort them by column number.
 * 3. Slide a window of size `seatCount` across the sorted array.
 * 4. For each window, verify the seats are column-contiguous (no gaps).
 * 5. Score each valid block by distance from the clicked seat, preferring
 *    blocks that include the clicked column first, then right-biased blocks.
 * 6. Return the seat IDs of the best block, or empty array if none found.
 *
 * @param {Object} clickedSeat - The seat the user clicked (has seat_label, id, etc.)
 * @param {number} seatCount - Number of adjacent seats requested
 * @param {Array} allSeats - Full seat array from the layout
 * @returns {string[]} Array of seat IDs forming the optimal contiguous block
 */
export function findBestAdjacentSeats(clickedSeat, seatCount, allSeats) {
  if (!clickedSeat?.seat_label || seatCount < 1 || !allSeats?.length) {
    return [];
  }

  const row = clickedSeat.seat_label.charAt(0);
  const clickedCol = parseInt(clickedSeat.seat_label.slice(1), 10);
  if (isNaN(clickedCol)) return [];

  const isBlocked = (s) =>
    s.type === 'passage' ||
    s.isBlocked ||
    s.status === 'blocked' ||
    s.status === 'booked' ||
    s.status === 'BOOKED' ||
    s.status === 'HELD';

  // Build a map of available column → seatId for the target row
  const rowSeats = allSeats
    .filter((s) => s.seat_label?.charAt(0) === row && !isBlocked(s))
    .sort(
      (a, b) =>
        parseInt(a.seat_label.slice(1), 10) -
        parseInt(b.seat_label.slice(1), 10)
    );

  const availableCols = rowSeats.map((s) =>
    parseInt(s.seat_label.slice(1), 10)
  );

  // If the clicked seat itself is not available, bail early
  if (!availableCols.includes(clickedCol)) return [];

  let bestBlock = [];
  let bestScore = Infinity;

  // Slide a window of size seatCount across the available seats in this row
  for (let i = 0; i <= rowSeats.length - seatCount; i++) {
    const candidate = rowSeats.slice(i, i + seatCount);
    const cols = candidate.map((s) => parseInt(s.seat_label.slice(1), 10));

    // Must be column-contiguous (123… not 124 or similar gaps)
    const isContiguous = cols.every(
      (c, idx) => idx === 0 || c === cols[idx - 1] + 1
    );
    if (!isContiguous) continue;

    // Scoring: lower is better
    const containsClicked = cols.includes(clickedCol);
    const minDist = Math.min(...cols.map((c) => Math.abs(c - clickedCol)));
    const leftExtension = clickedCol - Math.min(...cols);

    // Prefer blocks that:
    // 1. Include the clicked seat
    // 2. Extend more to the right (right-biased like BookMyShow)
    // 3. Are physically closest to the clicked seat
    const score = containsClicked
      ? 0 + leftExtension * 0.1
      : 1 + minDist + leftExtension * 0.01;

    if (score < bestScore) {
      bestScore = score;
      bestBlock = candidate;
    }
  }

  return bestBlock.map((s) => s.id);
}
