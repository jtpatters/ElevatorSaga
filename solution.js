{

    init: function(elevators, floors) {

        function stopElevator(elevator,floor,index){
            console.log("e:"+index+" prep unscheduled stopping at:"+floor.floorNum()+" q:"+elevator.destinationQueue);
            if(elevator.destinationQueue.indexOf(floor.floorNum())>-1){
                elevator.destinationQueue.splice(elevator.destinationQueue.indexOf(floor.floorNum(), 1));
                elevator.checkDestinationQueue();
            }
            elevator.goToFloor(floor.floorNum(), true); 
            console.log("e:"+index+" done prep unschedule stopping at:"+floor.floorNum()+" q:"+elevator.destinationQueue);
           
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

            floor.on("up_button_pressed down_button_pressed", function() {
                floor.lastPress = new Date();
            });
            
        });       

        elevators.forEach(function(elevator, index) {

            elevator.on("stopped_at_floor", function(floorNum) {
                floors[floorNum].enRoute=false;
                console.log("e:"+index+" stopping at:"+floorNum+" q:"+elevator.destinationQueue);
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
                    console.log("e:"+index+" on:"+elevator.currentFloor()+" requested to go to:"+floorNum)
                }
            });

            elevator.on("passing_floor", function(floorNum, direction) { 
                console.log("e:"+index+" passing:"+floorNum+" q:"+elevator.destinationQueue);
                if (elevator.loadFactor() > 0.7){
                    console.log("e:"+index+" passing - too full");
                }else if(floors[floorNum].buttonStates.down && direction == "down"){
                    goingDown(elevator,floors[floorNum],index);    
                }else if(floors[floorNum].buttonStates.up && direction == "up"){
                    goingUp(elevator,floors[floorNum],index);
                }else if (elevator.destinationQueue.indexOf(floorNum) != -1) { 
                    stopElevator(elevator,floors[floorNum],index);
                }
                console.log("e:"+index+" completed pass:"+floorNum+" q:"+elevator.destinationQueue);
            });

            elevator.on("idle", function() {
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(true);
                if (elevator.loadFactor()>0){
                    console.log("e:"+index+" IS IDLE AND NOT EMPTY... STUCK!");
                    elevator.goingUpIndicator(false);
                    elevator.goingDownIndicator(true);
                    elevator.goToFloor(0);       
                } else {
                    var target;
                    var min_distance=99;
                    var current_date=new Date();
                    for(var i=0; i<floors.length;i++){
                        if(floors[i].buttonStates.down || floors[i].buttonStates.up){
                            if(floors[i].enRoute){
                                //console.log("REQUESTED FLOOR "+floors[i].floorNum()+" ALREADY HAS ELEVATOR ENROUTE");
                                continue;
                            }
                            if(current_date - floors[i].lastPress>2000){
                                //console.log("Sending elevator to floor: "+floors[i].floorNum()+" based on wait time");
                                target=floors[i];
                                break;
                            } 
                            var distance=Math.abs(elevator.currentFloor()-floors[i].floorNum());
                            //console.log("Elevator: "+index+" distance calculated at: "+distance+" for floor:"+floors[i].floorNum());
                            if(distance<min_distance){
                                min_distance=distance;
                                target=floors[i];
                            }
                        }
                    }
                    if (target) {
                        target.enRoute=true;
                        elevator.goToFloor(target.floorNum());
                        console.log("e:"+index+" non-idle-heading to floor: "+target.floorNum());
                    } else {
                        elevator.goToFloor(0);
                    }

                }
            });
        });

    },
        update: function(dt, elevators, floors) {
            // We normally don't need to do anything here
        }
}
