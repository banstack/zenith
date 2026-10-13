import type { RawQuestion } from '../../topics/types'

export const math: RawQuestion[] = [
  // Difficulty 1
  [1, 'What is 6 × 9?', '54', '56', '45', '63', 'A quick check: the digits of a multiple of 9 add up to a multiple of 9.'],
  [1, 'What is 45 + 38?', '83', '73', '93', '82', '45 + 40 = 85, then take away 2.'],
  [1, 'What is 90 − 46?', '44', '54', '46', '36', '90 − 40 = 50, then take away 6.'],
  [1, 'What is 11 × 11?', '121', '111', '122', '131', '11 × 10 = 110, plus one more 11.'],
  [1, 'How many centimetres are in a metre?', '100', '10', '1,000', '60', '"Centi" means one hundredth.'],
  [1, 'What is double 35?', '70', '65', '60', '75', '30 + 30 = 60 and 5 + 5 = 10.'],
  [1, 'How many sides does an octagon have?', '8', '6', '7', '10', 'A stop sign is a familiar octagon.'],
  [1, 'What is 81 ÷ 9?', '9', '8', '7', '11', 'Because 9 × 9 = 81.'],
  [1, 'How many seconds are in 2 minutes?', '120', '100', '200', '60', 'Each minute has 60 seconds.'],
  [1, 'What is 1,000 − 1?', '999', '990', '9,999', '900', 'The number just below a thousand.'],
  [1, 'What is a quarter of 100?', '25', '20', '40', '50', 'Think of four quarters in a dollar.'],
  [1, 'How many degrees are in a full turn?', '360', '180', '90', '100', 'A half turn is 180 degrees.'],

  // Difficulty 2
  [2, 'What is 5 cubed?', '125', '25', '15', '75', '5 × 5 × 5 = 125.'],
  [2, 'What is 20% of 45?', '9', '8', '10', '12', '10% is 4.5, so 20% is double that.'],
  [2, 'What is 3/5 as a decimal?', '0.6', '0.35', '0.53', '0.5', '3 ÷ 5 = 0.6.'],
  [2, 'What is the square root of 81?', '9', '8', '7', '18', 'Because 9 × 9 = 81.'],
  [2, 'What is 16 × 4?', '64', '62', '68', '56', 'Doubling 16 twice: 32, then 64.'],
  [2, 'A pizza is cut into 8 slices and you eat 3. What fraction is left?', '5/8', '3/8', '3/5', '1/2', '8 − 3 = 5 slices, out of 8.'],
  [2, 'What is 1.5 × 4?', '6', '5.5', '6.5', '4.5', '1 × 4 = 4 and 0.5 × 4 = 2.'],
  [2, 'A car travels 60 km every hour. How far does it go in 2.5 hours?', '150 km', '120 km', '125 km', '160 km', '60 × 2 = 120, plus 30 for the half hour.'],

  // Difficulty 3
  [3, 'What is 3 to the power of 4?', '81', '64', '12', '27', '3 × 3 × 3 × 3 = 81.'],
  [3, 'What is two-thirds of 90?', '60', '45', '30', '66', 'A third of 90 is 30, so two-thirds is 60.'],
  [3, 'What is 17 × 6?', '102', '96', '112', '106', '10 × 6 = 60 and 7 × 6 = 42.'],
  [3, 'What is the perimeter of a square with sides of 9 cm?', '36 cm', '81 cm', '18 cm', '27 cm', 'Four sides of 9 cm. 81 would be its area in cm².'],
  [3, 'What is the Roman numeral for 100?', 'C', 'M', 'X', 'D', 'From centum, Latin for a hundred. M is 1,000.'],
  [3, 'What is 0.2 × 0.3?', '0.06', '0.6', '0.5', '0.006', '2 × 3 = 6, with two decimal places in total.'],
  [3, 'What is the median of 2, 5, 11, 6 and 21?', '6', '9', '11', '5', 'In order the list is 2, 5, 6, 11, 21, so the middle value is 6. The mean is 9.'],
  [3, 'How many minutes are in a day?', '1,440', '1,200', '1,400', '2,400', '24 hours × 60 minutes.'],
  [3, 'What is 7/8 as a percentage?', '87.5%', '78%', '85%', '87%', '1/8 is 12.5%, so 7/8 is 100% − 12.5%.'],
  [3, 'What is the area of a triangle with a base of 10 and a height of 6?', '30', '60', '16', '36', 'Half of base × height: ½ × 10 × 6.'],
  [3, 'What is −8 + 15?', '7', '−7', '23', '−23', 'Start at −8 and count 15 up.'],
  [3, 'How many corners (vertices) does a cube have?', '8', '6', '12', '4', 'Four on the top face and four on the bottom.'],

  // Difficulty 4
  [4, 'What is 15% of 240?', '36', '24', '32', '40', '10% is 24 and 5% is 12.'],
  [4, 'What is 13 squared?', '169', '139', '149', '196', '13 × 13 = 130 + 39. 196 is 14 squared.'],
  [4, 'What is the greatest common factor of 36 and 48?', '12', '6', '4', '24', '36 = 3 × 12 and 48 = 4 × 12.'],
  [4, 'The angles inside a hexagon add up to how many degrees?', '720', '540', '360', '1,080', 'A hexagon splits into four triangles: 4 × 180.'],
  [4, 'If 3x + 7 = 22, what is x?', '5', '3', '7', '15', 'Take away 7 to get 3x = 15, then divide by 3.'],
  [4, 'What is the cube root of 343?', '7', '9', '6', '8', '7 × 7 × 7 = 343.'],
  [4, 'A shirt costs $50 after a 20% discount. What was the original price?', '$62.50', '$60', '$70', '$65', '$50 is 80% of the original, and 50 ÷ 0.8 = 62.5.'],
  [4, 'How many diagonals does a pentagon have?', '5', '10', '3', '4', 'Each corner connects to two others, and each diagonal is shared by two corners: 5 × 2 ÷ 2.'],

  // Difficulty 5
  [5, 'What is 2 to the power of 16?', '65,536', '32,768', '16,384', '131,072', '2 to the 8th is 256, and 256 × 256 = 65,536.'],
  [5, 'How many prime numbers are there between 1 and 100?', '25', '24', '26', '21', 'They run from 2, 3, 5, 7 up to 89 and 97.'],
  [5, 'What is Euler\'s number, e, to two decimal places?', '2.72', '2.71', '3.14', '1.62', 'e = 2.71828…, which rounds up to 2.72.'],
  [5, 'How many edges does a regular dodecahedron have?', '30', '20', '12', '60', 'It has 12 faces, 20 corners and 30 edges.'],
  [5, 'Starting 1, 1, 2, 3, what is the 10th Fibonacci number?', '55', '34', '89', '44', '1, 1, 2, 3, 5, 8, 13, 21, 34, 55.'],
  [5, 'In how many different orders can 5 books be arranged on a shelf?', '120', '25', '60', '720', '5! = 5 × 4 × 3 × 2 × 1.'],
  [5, 'What is the golden ratio to three decimal places?', '1.618', '1.414', '1.732', '2.718', 'It is (1 + √5) ÷ 2. The others are √2, √3 and e.'],
  [5, 'What is 111,111,111 × 111,111,111?', '12,345,678,987,654,321', '12,345,678,900,000,000', '11,111,111,111,111,111', '123,456,789,987,654,321', 'The digits climb from 1 to 9 and back down again.'],
]
