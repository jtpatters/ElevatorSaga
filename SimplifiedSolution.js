{
    init: function(elevators, floors) {

        function stopElevator(elevator,floor,index){
            var floor_num=floor.floorNum();
            var floor_index = elevator.destinationQueue.indexOf(floor_num);
            if(floor_index>-1){
                var deleted = elevator.destinationQueue.splice(floor_index,1);
                elevator.checkDestinationQueue();
            }
            elevator.goToFloor(floor.floorNum(), true); 
        }

        function goingUp(elevator,floor,index){
            elevator.goingUpIndicator(true);
            elevator.goingDownIndicator(false);
            stopElevator(elevator,floor,index);
        }

        function goingDown(elevator,floor,index){
            elevator.goingUpIndicator(false);
            elevator.goingDownIndicator(true);  
            stopElevator(elevator,floor,index);
        }

        floors.forEach(function (floor) {
            floor.enRoute = false;
        });       

        elevators.forEach(function(elevator, index) {
            if(elevator.destinationQueue<2){
                elevator.mode="normal";
            }
            elevator.on("stopped_at_floor", function(floorNum) {
                floors[floorNum].enRoute=false;
                if(floorNum==floors.length-1){
                    elevator.goingUpIndicator(false);
                    elevator.goingDownIndicator(true);
                } else if (floorNum == 0){
                    elevator.goingUpIndicator(true);
                    elevator.goingDownIndicator(false);
                }
            });

            elevator.on("floor_button_pressed", function(floorNum) {  
                if (elevator.destinationQueue.indexOf(floorNum) == -1) {
                    elevator.goToFloor(floorNum); 
                }
            });

            elevator.on("passing_floor", function(floorNum, direction) { 
                if (elevator.destinationQueue.indexOf(floorNum) != -1) { 
                    stopElevator(elevator,floors[floorNum],index);
                }else if (elevator.mode=="express"){
                    //console.log("e:"+index+" in express mode :)");
                }else if(elevator.loadFactor() > 0.85 ){ //|| elevator.destinationQueue.length>4){
                    elevator.mode="express";
                }else if(floors[floorNum].buttonStates.down && direction == "down"){
                    goingDown(elevator,floors[floorNum],index);    
                }else if(floors[floorNum].buttonStates.up && direction == "up"){
                    goingUp(elevator,floors[floorNum],index);
                }
            });

            elevator.on("idle", function() {     
                elevator.mode="normal";
                request_floor_found=false;
                for(var i=floors.length-1; i>=0;i--){
                    if(floors[i].buttonStates.down || floors[i].buttonStates.up){
                        if(floors[i].enRoute){
                            continue;
                        }
                        floors[i].enRoute=true;
                        elevator.goToFloor(floors[i].floorNum());
                        elevator.goingUpIndicator(true);
                        elevator.goingDownIndicator(true);
                        request_floor_found=true;
                    }
                }
                if(!request_floor_found){
                    elevator.goToFloor(0);
                    floors[0].enRoute=true;
                    elevator.goingUpIndicator(false);
                    elevator.goingDownIndicator(true);
                }           
            });
        });
    },
        update: function(dt, elevators, floors) {
            // We normally don't need to do anything here
        }
}
