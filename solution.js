{
    
    init: function(elevators, floors) {
        
        function stopElevator(elevator,floorNum){
            console.log("stopping at floor: "+floorNum);
            console.log("destingation queue prior:"+elevator.destinationQueue);
            elevator.destinationQueue.splice(elevator.destinationQueue.indexOf(floorNum), 1);
            elevator.goToFloor(floorNum, true); 
            elevator.checkDestinationQueue();
            console.log("destingation queue after:"+elevator.destinationQueue);
        }
        
        elevators.forEach(function(elevator, index) {
        
        elevator.on("floor_button_pressed", function(floorNum) {  
            if (elevator.destinationQueue.indexOf(floorNum) == -1) {
                elevator.goToFloor(floorNum); 
            }
        });
       
        elevator.on("passing_floor", function(floorNum, direction) { 
            console.log("passing floor:"+floorNum+" going direction:"+direction)
            if (elevator.loadFactor() >= 0.95){
                console.log("elevator passing - too full");
            }else if(floors[floorNum].buttonStates.down && direction == "down"){
                elevator.goingDownIndicator(true);
                elevator.goingUpIndicator(false);
                floors[floorNum].buttonStates.down = "";
                stopElevator(elevator,floorNum);
            }else if(floors[floorNum].buttonStates.up && direction == "up"){
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(false);
                floors[floorNum].buttonStates.up = "";
                stopElevator(elevator,floorNum);
            }else if (elevator.destinationQueue.indexOf(floorNum) != -1) { 
                stopElevator(elevator,floorNum);
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
                            console.log("demand includes:"+demand[i].floorNum())
                        }
                    }
                    if (min_floor) {
                        target = min_floor.floorNum();
                        floors[target].buttonStates.up = "";
                        floors[target].buttonStates.down = "";
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
