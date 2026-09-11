/*
 * presets.js - representative frame geometry + component setups.
 * Values follow typical manufacturer geometry charts for each category.
 * Add your own bike: copy an entry and fill in the chart numbers.
 */

export const PRESETS = {
  'Road race (56 cm)': {
    frame: {
      stack: 565, reach: 390, headAngle: 73.0, seatAngle: 73.5,
      headTubeLength: 155, chainstay: 410, bbDrop: 70,
      forkOffset: 45, seatTubeLength: 540, wheelbase: 990,
    },
    components: {
      beadSeat: 622, tireWidth: 28, spacers: 15, headsetTopCap: 10,
      stemLength: 100, stemAngle: -6, barReach: 75, barDrop: 130, barRise: 0,
      saddleHeight: 730, saddleSetback: 20, saddleLength: 270,
      crankLength: 172.5, stemClampHeight: 40,
    },
  },
  'Endurance road (56 cm)': {
    frame: {
      stack: 590, reach: 380, headAngle: 72.5, seatAngle: 73.0,
      headTubeLength: 180, chainstay: 415, bbDrop: 72,
      forkOffset: 47, seatTubeLength: 540, wheelbase: 1000,
    },
    components: {
      beadSeat: 622, tireWidth: 32, spacers: 25, headsetTopCap: 10,
      stemLength: 90, stemAngle: -6, barReach: 70, barDrop: 130, barRise: 0,
      saddleHeight: 730, saddleSetback: 15, saddleLength: 270,
      crankLength: 172.5, stemClampHeight: 40,
    },
  },
  'Gravel (M / 54 cm)': {
    frame: {
      stack: 585, reach: 385, headAngle: 71.5, seatAngle: 73.5,
      headTubeLength: 165, chainstay: 425, bbDrop: 76,
      forkOffset: 50, seatTubeLength: 520, wheelbase: 1030,
    },
    components: {
      beadSeat: 622, tireWidth: 42, spacers: 20, headsetTopCap: 10,
      stemLength: 90, stemAngle: -6, barReach: 70, barDrop: 115, barRise: 0,
      saddleHeight: 720, saddleSetback: 15, saddleLength: 270,
      crankLength: 172.5, stemClampHeight: 40,
    },
  },
  'XC hardtail 29er (M)': {
    frame: {
      stack: 615, reach: 440, headAngle: 67.5, seatAngle: 75.0,
      headTubeLength: 100, chainstay: 435, bbDrop: 60,
      forkOffset: 44, seatTubeLength: 420, wheelbase: 1150,
    },
    components: {
      beadSeat: 622, tireWidth: 57, spacers: 20, headsetTopCap: 10,
      stemLength: 60, stemAngle: 0, barReach: 0, barDrop: 0, barRise: 15,
      saddleHeight: 730, saddleSetback: 10, saddleLength: 270,
      crankLength: 170, stemClampHeight: 40,
    },
  },
  'Trail full-sus (M)': {
    frame: {
      stack: 625, reach: 455, headAngle: 65.5, seatAngle: 77.0,
      headTubeLength: 105, chainstay: 435, bbDrop: 30,
      forkOffset: 44, seatTubeLength: 405, wheelbase: 1215,
    },
    components: {
      beadSeat: 622, tireWidth: 63, spacers: 20, headsetTopCap: 10,
      stemLength: 45, stemAngle: 0, barReach: 0, barDrop: 0, barRise: 20,
      saddleHeight: 730, saddleSetback: 5, saddleLength: 270,
      crankLength: 170, stemClampHeight: 40,
    },
  },
  'City / hybrid (M)': {
    frame: {
      stack: 610, reach: 390, headAngle: 71.0, seatAngle: 73.0,
      headTubeLength: 160, chainstay: 445, bbDrop: 65,
      forkOffset: 45, seatTubeLength: 480, wheelbase: 1070,
    },
    components: {
      beadSeat: 622, tireWidth: 40, spacers: 30, headsetTopCap: 10,
      stemLength: 80, stemAngle: 10, barReach: 0, barDrop: 0, barRise: 25,
      saddleHeight: 700, saddleSetback: 10, saddleLength: 270,
      crankLength: 170, stemClampHeight: 40,
    },
  },
};
