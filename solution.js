{

    init: function(elevators, floors) {

        function stopElevator(elevator,floor){
            elevator.destinationQueue.splice(elevator.destinationQueue.indexOf(floor.floorNum()), 1);
            elevator.goToFloor(floor.floorNum(), true); 
            elevator.checkDestinationQueue();
        }
        
        function clearFloor(floor){
            floor.requestedUp = false;
            floor.requestedDown = false;
        }
        
        function goingUp(elevator,floor){
            elevator.goingUpIndicator(true);
            elevator.goingDownIndicator(false);
            floor.requestedUp = false;
            stopElevator(elevator,floor);
        }
        
        function goingDown(elevator,floor){
            elevator.goingUpIndicator(false);
            elevator.goingDownIndicator(true);
            floor.requestedDown = false;
            stopElevator(elevator,floor);
        }

        elevators.forEach(function(elevator, index) {

            elevator.on("floor_button_pressed", function(floorNum) {  
                if (elevator.destinationQueue.indexOf(floorNum) == -1) {
                    elevator.goToFloor(floorNum); 
                }
            });

            elevator.on("passing_floor", function(floorNum, direction) { 
                console.log("passing floor:"+floorNum+" going direction:"+direction)
                if (elevator.loadFactor() >= 0.85){
                    console.log("elevator passing - too full");
                }else if(floors[floorNum].buttonStates.down && direction == "down"){
                    goingDown(elevator,floors[floorNum]);    
                }else if(floors[floorNum].buttonStates.up && direction == "up"){
                    goingUp(elevator,floors[floorNum]);
                }else if (elevator.destinationQueue.indexOf(floorNum) != -1) { 
                    stopElevator(elevator,floors[floorNum]);
                }
            });

            elevator.on("idle", function() {
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(true);
                if(elevator.destinationQueue.length==0){
                    console.log("Queue is empty - searching for other floors");
                    var target;
                    let demand = floors.filter((floor) => (floor.buttonStates.up || floor.buttonStates.down));
                    if(demand.length){
                        var min_distance=99;
                        var min_floor;
                        for(var i=0;i<demand.length;i++){
                            var distance=Math.abs(elevator.currentFloor()-demand[i].floorNum());
                            if(distance<min_distance){
                                min_distance=distance;
                                min_floor=demand[i];
                            }                  
                        }
                    }
                    if (min_floor) {
                        target = min_floor.floorNum();
                        clearFloor(min_floor);
                        console.log("heading to floor: "+target);
                    } else {
                        target = 0;
                        console.log("going to the lobby");
                    }
                    elevator.goToFloor(target);
                }
            });
        });

    },
        update: function(dt, elevators, floors) {
            // We normally don't need to do anything here
        }
}
