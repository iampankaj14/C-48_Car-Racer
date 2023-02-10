class Game {
  constructor() {
    this.resetTitle = createElement("H2");
    this.resetButton = createButton("");

    this.leaderboardTitle = createElement("H2");
    this.leader1 = createElement("H2");
    this.leader2 = createElement("H2");

    this.playerMoving = false;
    this.leftKeyActive = false;
    this.blast = false;
  }                             

  getState() {
    var gameStateRef = database.ref("gameState");
    gameStateRef.on("value", function (data) {
      gameState = data.val();
    });
  }
  update(state) {
    database.ref("/").update({
      gameState: state,
    });
  }

  start() {
    player = new Player();
    playerCount = player.getCount();

    form = new Form();
    form.display();

    car1 = createSprite(width / 2 - 50, height - 100);
    car1.addImage("car1", car1_img);
    car1.addImage("blast", blastImage);
    car1.scale = 0.07;

    car2 = createSprite(width / 2 + 100, height - 100);
    car2.addImage("car2", car2_img);
    car2.addImage("blast", blastImage);
    car2.scale = 0.07;

    cars = [car1, car2];

    // C38 TA
    fuels = new Group();
    powerCoins = new Group();
    obstacle1 = new Group();
    obstacle2 = new Group();

    var obstacle1Positions = [
      { x: width / 2 - 150, y: height - 6800, image: obstacle1Image },
      { x: width / 2 + 250, y: height - 7300, image: obstacle1Image },
      { x: width / 2 - 180, y: height - 6800, image: obstacle1Image },

      { x: width / 2 - 150, y: height - 73800, image: obstacle1Image },
      { x: width / 2, y: height - 8800, image: obstacle1Image },
    ];

    var obstacle2Positions = [
      { x: width / 2 + 250, y: height - 4300, image: obstacle2Image },
      { x: width / 2 - 180, y: height - 5800, image: obstacle2Image },
      { x: width / 2, y: height - 6300, image: obstacle2Image },

      { x: width / 2 + 180, y: height - 6800, image: obstacle2Image },
      { x: width / 2 + 250, y: height - 7300, image: obstacle2Image },
      { x: width / 2 + 250, y: height - 8100, image: obstacle2Image },
      { x: width / 2 - 180, y: height - 9000, image: obstacle2Image },
    ];

    // Adding fuel sprite in the game
    this.addSprites(fuels, 4, fuelImage, 0.02);

    // Adding coin sprite in the game
    this.addSprites(powerCoins, 18, powerCoinImage, 0.09);

    this.addSprites(
      obstacle1,
      obstacle1Positions.length,
      obstacle1Image,
      0.04,
      obstacle1Positions
    );
    this.addSprites(
      obstacle2,
      obstacle2Positions.length,
      obstacle2Image,
      0.04,
      obstacle2Positions
    );
  }

  // C38 TA
  addSprites(spriteGroup, numberOfSprites, spriteImage, scale, positions = []) {
    for (var i = 0; i < numberOfSprites; i++) {
      var x, y;

      if (positions.length > 0) {
        x = positions[i].x;
        y = positions[i].x;
        spriteImage = positions[i].image;
      } else {
        x = random(width / 2 + 150, width / 2 - 150);
        y = random(-height * 4.5, height - 400);
      }

      var sprite = createSprite(x, y);
      sprite.addImage("sprite", spriteImage);

      sprite.scale = scale;
      spriteGroup.add(sprite);
    }
  }

  handleElements() {
    form.hide();
    form.titleImg.position(40, 50);
    form.titleImg.class("gameTitleAfterEffect");

    this.resetTitle.position(width / 2 + 200, 40);
    this.resetTitle.class("resetText");

    this.resetButton.position(width / 2 + 230, 100);
    this.resetButton.class("resetButton");

    this.leaderboardTitle.position(width / 3 - 60, 40);
    this.leaderboardTitle.class("resetText");
    this.leaderboardTitle.html("Leaderboard");

    this.leader1.position(width / 3 - 50, 80);
    this.leader1.class("leadersText");

    this.leader2.position(width / 3 - 50, 130);
    this.leader2.class("leadersText");
  }

  play() {
    this.handleElements();
    this.handleResetButton();
    player.getCarsAtEnd();
    Player.getPlayersInfo();

    if (allPlayers !== undefined) {
      image(track, 0, -height * 5, width, height * 6);
      this.showLeaderboard();
      this.showLife();
      this.showFuelBar();
      //index of the array
      var index = 0;
      for (var plr in allPlayers) {
        //add 1 to the index for every loop
        index = index + 1;

        //use data form the database to display the cars in x and y direction
        var x = allPlayers[plr].positionX;
        var y = height - allPlayers[plr].positionY;
        var currentLife = allPlayers[plr].life;

        if(currentLife <= 0){
          cars[index - 1].changeImage("blast");
          cars[index - 1].scale = 0.3;
          
        }

        cars[index - 1].position.x = x;
        cars[index - 1].position.y = y;

        // C38  SA
        if (index === player.index) {
          stroke(10);
          fill("red");
          ellipse(x, y, 60, 60);

          this.handleFuel(index);
          this.handlePowerCoins(index);
          this.handleObstacleCollision(index);

          if(player.life <= 0){
            this.blast = true;
            this.playerMoving = false;
          }
          // Changing camera position in y direction
          camera.position.x = cars[index - 1].position.x;
          camera.position.y = cars[index - 1].position.y;
        }
      }

      // handling keyboard events
      if(this.playerMoving){
        player.positionY += 5;
        player.update();
      }

      this.handlePlayerControl();
      const finishLine = height * 6 - 100;
      if (player.positionY > finishLine) {
        gameState = 2;
        player.rank += 1;
        Player.updateCarsAtEnd(player.rank);
        player.update();
        this.showRank();
      }
      drawSprites();
    }
  }

  handleFuel(index) {
    // Adding fuel
    cars[index - 1].overlap(fuels, function (collector, collected) {
      player.fuel = 185;
      //collected is the sprite in the group collectibles that triggered
      //the event
      collected.remove();
    });

    if (player.fuel > 0 && this.playerMoving) {
      player.fuel -= 0.4;
    }

    if (player.fuel < 0) {
      gameState = 2;
      this.gameOver();
    }
  }

  handlePowerCoins(index) {
    cars[index - 1].overlap(powerCoins, function (collector, collected) {
      player.score += 21;
      player.update();
      //collected is the sprite in the group collectibles that triggered
      //the event
      collected.remove();
    });
  }

  handleResetButton() {
    this.resetButton.mousePressed(() => {
      database.ref("/").update({
        playerCount: 0,
        gameState: 0,
        carsAtEnd: 0,
        players: {},
      });
      window.location.reload();
    });
  }

  handlePlayerControl() {
   
    if(!this.blast){
       if (keyIsDown(UP_ARROW)) {
         player.positionY += 10;
         player.update();
         this.playerMoving = true;
       }

       if (keyIsDown(LEFT_ARROW) && player.positionX > width / 3 - 50) {
         player.positionX -= 5;
         player.update();
         this.leftKeyActive = true;
       }

       if (keyIsDown(RIGHT_ARROW) && player.positionX < width / 2 + 280) {
         player.positionX += 5;
         player.update();
         this.leftKeyActive = false;
       }
    }
  }

  showLeaderboard() {
    var leader1, leader2;
    var players = Object.values(allPlayers);

    if (
      (players[0].rank === 0 && players[1].rank === 0) ||
      players[0].rank === 1
    ) {
      leader1 =
        players[0].rank +
        "&emsp;" +
        players[0].name +
        "&emsp;" +
        players[0].score;
      leader2 =
        players[1].rank +
        "&emsp;" +
        players[1].name +
        "&emsp;" +
        players[1].score;
    }

    if (players[1].rank === 1) {
      leader1 =
        players[1].rank +
        "&emsp;" +
        players[1].name +
        "&emsp;" +
        players[1].score;
      leader2 =
        players[2].rank +
        "&emsp;" +
        players[2].name +
        "&emsp;" +
        players[2].score;
    }

    this.leader1.html(leader1);
    this.leader2.html(leader2);
  }

  showRank() {
    swal({
      title: `AWESOME!${"\n"} RANK${"\n"} ${player.rank}`,
      text: "YOU REACHED FINISHING LINE SUCCESSFULLY",
      imageUrl:
        "https://raw.githubusercontent.com/vishalgaddam873/p5-multiplayer-car-race-game/master/assets/cup.png",
      imageSize: "100x100",
      confirmButtonText: "OK",
    });
  }

  showLife() {
    push();
    image(lifeImg, width / 2 - 260, height - player.positionY - 310, 20, 20);
    fill("white");
    rect(width / 2 - 230, height - player.positionY - 310, 185, 20);
    fill("#f50057");
    rect(width / 2 - 230, height - player.positionY - 310, player.life, 20);
    noStroke();
    pop();
  }

  showFuelBar() {
    push();
    image(fuelImage, width / 2 + 30, height - player.positionY - 310, 20, 20);
    fill("white");
    rect(width / 2 + 60, height - player.positionY - 310, 185, 20);
    fill("#ffc400");
    rect(width / 2 + 60, height - player.positionY - 310, player.fuel, 20);
    noStroke();
    pop();
  }

  gameOver() {
    swal({
      title: `Game Over ;(`,
      text: "Ohh! You Lost The Game :/",
      imageUrl:
        "https://cdn.shopify.com/s/files/1/1061/1924/products/Thumbs_Down_Sign_Emoji_Icon_ios10_grande.png",
      imageSize: "100x100",
      confirmButtonText: "Thanks for playing :)",
    });
  }

  handleObstacleCollision(index) {

    if(cars [index - 1].collide(obstacle1) || cars [index - 1].collide(obstacle2)){
      if(this.leftKeyActive ){
        player.positionX += 100
      }  
      else {
        player.positionX -= 100
      }

       if (player.life > 0) {
         player.life -= 185 / 4;
       }

      // if (player.life < 0) {
       //  gameState = 2;
        // this.gameOver();
     //  }
       player.update();
    }
  }


}
