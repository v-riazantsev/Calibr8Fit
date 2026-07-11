import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import AppText from "./AppText";
import DynamicIcon, { IconItem } from "./DynamicIcon";
import Popup from "./Popup";
import TextButton from "./TextButton";
import TextField from "./TextField";

type BaseProps = {
  icon: IconItem;
  label: string;
};

type BooleanSettingProps = BaseProps & {
  type: "boolean";
  value: boolean;
  onValueChange: (value: boolean) => void;
};

type TextSettingProps = BaseProps & {
  type: "text";
  value: string;
  onValueChange: (value: string) => void;
  multiline?: boolean;
};

type DateSettingProps = BaseProps & {
  type: "date";
  value: Date;
  onValueChange: (value: Date) => void;
};

type NumberSettingProps = BaseProps & {
  type: "number";
  value: number;
  onValueChange: (value: number) => void;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  integer?: boolean;
};

type SelectOption<T = string> = {
  label: string;
  value: T;
};

type SelectSettingProps<T = string> = BaseProps & {
  type: "select";
  value: T;
  onValueChange: (value: T) => void;
  options: SelectOption<T>[];
};

type Props<T = string> =
  | BooleanSettingProps
  | TextSettingProps
  | DateSettingProps
  | NumberSettingProps
  | SelectSettingProps<T>;

export default function SettingsItem<T = string>(props: Props<T>) {
  const theme = useTheme();
  const [showPopup, setShowPopup] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempValue, setTempValue] = useState<number>(
    props.type === "number" ? props.value : 0,
  );
  const [tempTextValue, setTempTextValue] = useState<string>(
    props.type === "text" ? props.value : "",
  );
  const [tempDateValue, setTempDateValue] = useState<Date>(() => {
    if (props.type === "date") {
      return props.value instanceof Date ? props.value : new Date(props.value);
    }
    return new Date();
  });
  const [tempSelectValue, setTempSelectValue] = useState<any>(
    props.type === "select" ? props.value : 0,
  );

  // Update temp value when popup opens
  useEffect(() => {
    if (showPopup && props.type === "number") {
      setTempValue(props.value);
    }
    if (showPopup && props.type === "text") {
      setTempTextValue(props.value);
    }
    if (showPopup && props.type === "select") {
      setTempSelectValue(props.value);
    }
  }, [showPopup, props]);

  const handlePress = useCallback(() => {
    if (props.type === "number") setTempValue(props.value);
    else if (props.type === "text") setTempTextValue(props.value);
    else if (props.type === "date") setShowDatePicker(true);
    else if (props.type === "select") setTempSelectValue(props.value);

    if (props.type !== "boolean" && props.type !== "date") setShowPopup(true);
  }, [props]);

  const handleSave = useCallback(() => {
    if (props.type === "number") {
      props.onValueChange(tempValue);
      setShowPopup(false);
    } else if (props.type === "text") {
      props.onValueChange(tempTextValue);
      setShowPopup(false);
    } else if (props.type === "date") {
      props.onValueChange(tempDateValue);
      setShowPopup(false);
    } else if (props.type === "select") {
      props.onValueChange(tempSelectValue);
      setShowPopup(false);
    }
  }, [props, tempValue, tempTextValue, tempDateValue, tempSelectValue]);

  const handleCancel = useCallback(() => {
    setShowPopup(false);
    if (props.type === "number") {
      setTempValue(props.value);
    } else if (props.type === "text") {
      setTempTextValue(props.value);
    } else if (props.type === "date") {
      setTempDateValue(props.value);
    } else if (props.type === "select") {
      setTempSelectValue(props.value);
    }
  }, [props]);

  const content = (
    <View style={styles.contentRow}>
      <DynamicIcon
        name={props.icon.name}
        library={props.icon.library}
        size={props.icon.size || 24}
        color={props.icon.color}
      />
      <AppText type="title-medium" style={styles.flex1}>
        {props.label}
      </AppText>
      {props.type === "boolean" && (
        <Switch
          trackColor={{ false: theme.outline, true: theme.primary }}
          thumbColor={props.value ? theme.onPrimary : theme.surfaceContainer}
          onValueChange={props.onValueChange}
          value={props.value}
        />
      )}
      {props.type === "text" && (
        <AppText type="title-medium" style={styles.underlinedValue}>
          {props.value || "Not set"}
        </AppText>
      )}
      {props.type === "date" && (
        <AppText type="title-medium" style={styles.underlinedValue}>
          {new Date(props.value).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </AppText>
      )}
      {props.type === "number" && (
        <AppText type="title-medium" style={styles.underlinedValue}>
          {props.value ?? 0}
          {props.unit && ` ${props.unit}`}
        </AppText>
      )}
      {props.type === "select" && (
        <AppText type="title-medium" style={styles.underlinedValue}>
          {props.options.find((opt) => opt.value === props.value)?.label ||
            String(props.value)}
        </AppText>
      )}
    </View>
  );

  if (props.type === "text") {
    return (
      <>
        <Pressable onPress={handlePress}>{content}</Pressable>
        <Popup visible={showPopup} onClose={handleCancel}>
          <AppText type="title-large" style={styles.textCenter}>
            {props.label}
          </AppText>
          <TextField
            label={props.label}
            type="text"
            value={tempTextValue}
            onChangeText={setTempTextValue}
            textAlign="left"
            numberOfLines={10}
            multiline={props.multiline}
          />
          <View style={styles.buttonRow}>
            <TextButton
              label="Cancel"
              variant="tonal"
              style={styles.flex1}
              onPress={handleCancel}
            />
            <TextButton
              label="Save"
              variant="filled"
              style={styles.flex1}
              onPress={handleSave}
            />
          </View>
        </Popup>
      </>
    );
  }

  if (props.type === "date") {
    return (
      <>
        <Pressable onPress={handlePress}>{content}</Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={
              tempDateValue instanceof Date
                ? tempDateValue
                : new Date(tempDateValue)
            }
            onChange={(event, date) => {
              if (date) {
                props.onValueChange(date);
              }
              setShowDatePicker(false);
            }}
            display="spinner"
          />
        )}
      </>
    );
  }

  if (props.type === "number") {
    return (
      <>
        <Pressable onPress={handlePress}>{content}</Pressable>
        <Popup visible={showPopup} onClose={handleCancel}>
          <AppText type="title-large" style={styles.textCenter}>
            {props.label}
          </AppText>
          <TextField
            label={props.label}
            type="number"
            value={(tempValue ?? 0).toString()}
            onChangeText={(text) => {
              if (text === "" || text === "-") {
                setTempValue(0);
              } else {
                const num = parseFloat(text);
                setTempValue(isNaN(num) ? 0 : num);
              }
            }}
            suffix={props.unit}
            textAlign="center"
            keyboardType="numeric"
            maxValue={props.maxValue}
            minValue={props.minValue}
            numberControls={true}
            numberStep={
              props.maxValue && props.maxValue <= 100
                ? 1
                : props.maxValue && props.maxValue <= 1000
                  ? 10
                  : 100
            }
          />
          <View style={styles.buttonRow}>
            <TextButton
              label="Cancel"
              variant="tonal"
              style={styles.flex1}
              onPress={handleCancel}
            />
            <TextButton
              label="Save"
              variant="filled"
              style={styles.flex1}
              onPress={handleSave}
            />
          </View>
        </Popup>
      </>
    );
  }

  if (props.type === "select") {
    return (
      <>
        <Pressable onPress={handlePress}>{content}</Pressable>
        <Popup visible={showPopup} onClose={handleCancel}>
          <AppText type="title-large" style={styles.textCenter}>
            {props.label}
          </AppText>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.optionsContainer}>
              {props.options.map((option) => (
                <Pressable
                  key={String(option.value)}
                  onPress={() => setTempSelectValue(option.value)}
                  style={styles.optionRow}
                >
                  <View
                    style={[styles.radioOuter, { borderColor: theme.primary }]}
                  >
                    {tempSelectValue === option.value && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: theme.primary },
                        ]}
                      />
                    )}
                  </View>
                  <AppText
                    type="title-medium"
                    style={[styles.flex1, { color: theme.onSurface }]}
                  >
                    {option.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View style={styles.buttonRow}>
            <TextButton
              label="Cancel"
              variant="tonal"
              style={styles.flex1}
              onPress={handleCancel}
            />
            <TextButton
              label="Save"
              variant="filled"
              style={styles.flex1}
              onPress={handleSave}
            />
          </View>
        </Popup>
      </>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
  },
  flex1: {
    flex: 1,
  },
  underlinedValue: {
    textDecorationLine: "underline",
  },
  textCenter: {
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  scrollView: {
    maxHeight: 300,
  },
  optionsContainer: {
    gap: 8,
    paddingVertical: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
