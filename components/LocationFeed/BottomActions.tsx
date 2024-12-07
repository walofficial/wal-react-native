import React, { memo } from "react";
import Animated from "react-native-reanimated";
import BottomLocationActions from "../BottomLocationActions";

const BottomActions = memo(({ style, taskId, onExpandLiveUsers }) => {
  return (
    <Animated.View style={style}>
      <BottomLocationActions
        taskId={taskId}
        onExpandLiveUsers={onExpandLiveUsers}
      />
    </Animated.View>
  );
});

export default BottomActions;
