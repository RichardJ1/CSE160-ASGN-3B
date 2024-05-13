class Camera {
  constructor() {
      this.eye = new Vector3([0, 0, -3]);
      this.at = new Vector3([0, 0, 100]);
      this.up = new Vector3([0, 1, 0]);
  }

  movement(moveType) {
      let move = new Vector3;
      move.set(this.at);
      move.sub(this.eye);
      move.normalize();

      if (moveType == "forward") {
          this.eye = this.eye.add(move);
          this.at = this.at.add(move);
      }
      if (moveType == "back") {
          this.eye = this.eye.sub(move);
          this.at = this.at.sub(move);
      }
      if (moveType == "right") {
          let side = Vector3.cross(this.up, move);
          this.at.add(side);
          this.eye.add(side);
      }
      if (moveType == "left") {
          let side = Vector3.cross(this.up, move);
          this.at.sub(side);
          this.eye.sub(side);
      }
      if (moveType == "up") {
          this.eye.add(this.up);
      }
      if (moveType == "down") {
          this.eye.sub(this.up);
      }
      
  }

  rotateCameraLR(direction) {
    let atP = new Vector3;
    atP.set(this.at);
    atP.sub(this.eye);
    let r = Math.sqrt(atP.elements[0] * atP.elements[0] + atP.elements[2] * atP.elements[2]);
    let theta = Math.atan2(atP.elements[2], atP.elements[0]);
    if (direction == "left") {
        theta += (5 * Math.PI / 180);
    }
    if (direction == "right") {
        theta -= (5 * Math.PI / 180);
    }
    atP.elements[0] = r * Math.cos(theta);
    atP.elements[2] = r * Math.sin(theta);
    this.at.set(atP);
    this.at.add(this.eye);
  }

  rotateCameraUD(direction) {
    let atP = new Vector3;
    atP.set(this.at);
    atP.sub(this.eye);
    let r = Math.sqrt(atP.elements[1] * atP.elements[1] + atP.elements[2] * atP.elements[2]);
    let theta = Math.atan2(atP.elements[2], atP.elements[1]);
    if (direction == "up") {
        theta += (5 * Math.PI / 180);
    }
    if (direction == "down") {
        theta -= (5 * Math.PI / 180);
    }
    atP.elements[1] = r * Math.cos(theta);
    atP.elements[2] = r * Math.sin(theta);
    this.at.set(atP);
    this.at.add(this.eye);
  }

}